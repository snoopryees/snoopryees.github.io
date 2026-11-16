"""
Browser port helper for Dungeon Crawler.

The game was written for a terminal and blocks on input(). A browser tab cannot block,
so this rewrites the game's source when it loads: every function that reads input
(directly or through another game function) becomes async, and those calls are awaited.
The original .py files are not edited.
"""
import ast

MODULES = ["characters", "combat", "inputs", "game"]
ASYNC_INPUT_NAME = "ainput_"


def _is_main_guard(node):
    return isinstance(node, ast.If) and "__main__" in ast.dump(node.test)


def transform(sources):
    """Take {module name: source} and return {module name: source that awaits its input}."""
    trees = {name: ast.parse(source) for name, source in sources.items()}

    functions = {}
    for tree in trees.values():
        tree.body = [node for node in tree.body if not _is_main_guard(node)]
        for node in tree.body:
            if isinstance(node, ast.FunctionDef):
                functions[node.name] = node

    def called_names(function):
        return {call.func.id for call in ast.walk(function)
                if isinstance(call, ast.Call) and isinstance(call.func, ast.Name)}

    blocking = {name for name, function in functions.items() if "input" in called_names(function)}
    grew = True
    while grew:
        grew = False
        for name, function in functions.items():
            if name not in blocking and called_names(function) & blocking:
                blocking.add(name)
                grew = True

    class Awaiter(ast.NodeTransformer):
        def visit_FunctionDef(self, node):
            self.generic_visit(node)
            if node.name not in blocking:
                return node
            fields = {field: getattr(node, field) for field in node._fields}
            return ast.copy_location(ast.AsyncFunctionDef(**fields), node)

        def visit_Call(self, node):
            self.generic_visit(node)
            if isinstance(node.func, ast.Name):
                if node.func.id == "input":
                    node.func.id = ASYNC_INPUT_NAME
                    return ast.copy_location(ast.Await(node), node)
                if node.func.id in blocking:
                    return ast.copy_location(ast.Await(node), node)
            return node

    result = {}
    for name, tree in trees.items():
        tree = ast.fix_missing_locations(Awaiter().visit(tree))
        result[name] = ast.unparse(tree)
    return result
