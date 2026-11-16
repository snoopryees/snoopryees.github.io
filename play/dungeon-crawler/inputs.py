import sys
from characters import save_character, make_boss
from combat import handle_boss_battle

def dialogue(character):
    """
    Handle NPC dialogue with the Old Man, cycling through three different messages.

    The Old Man has three messages that cycle in order, after the third message, it continues to repeat the good
    luck message.

    :param character: A dictionary containing character information including dialogue_count
    :precondition: character must be a dictionary
    :postcondition: Updates the character's dialogue_count and prints appropriate message
    :return: The updated character dictionary with incremented dialogue_count
    """
    speeches = [
        "Hello adventurer welcome to the dungeon! You can start by entering the portal and trying to fight through these challenges.",
        "Don't worry about dying, you will wake up back here every time you die and you can upgrade your skills or purchase potions.",
        "Good luck adventurer!"
    ]

    if 'dialogue_count' not in character:
        character['dialogue_count'] = 0

    if character['dialogue_count'] == 0:
        print(f"He says: {speeches[0]}")
    elif character['dialogue_count'] == 1:
        print(f"He says: {speeches[1]}")
    else:
        print(f"He says: {speeches[2]}")

    character['dialogue_count'] += 1
    return character


def draw_map(board, character, rows, columns):
    """
    Draw the game map with ASCII art showing the character's position and room symbols.

    :param board: A dictionary representing the game board
    :param character: A dictionary representing the character with X and Y coordinates
    :param rows: Number of rows in the board
    :param columns: Number of columns in the board
    :precondition: All parameters must be valid and consistent with each other
    :postcondition: Prints an ASCII representation of the map with the character's position
    :return: None
    """

    room_symbols = {
        # Floor 1 - Dungeon theme
        "Empty Room": " ",
        "Dusty Room": "d",
        "Dirty Room": "~",
        "Dark Room": "#",
        "Cobweb Room": "w",

        # Floor 2 - Animal kingdom theme
        "Grassland Room": "^",
        "Forest Room": "f",
        "Jungle Room": "j",
        "Nest Room": "n",
        "Den Room": "d",

        # Floor 3 - Japan theme
        "Dojo Room": "d",
        "Garden Room": "g",
        "Temple Room": "t",
        "Shrine Room": "s",
        "Palace Room": "p",

        # Special rooms
        "Shop": "S",
        "Portal Room": "O",
        "Upgrade Room": "U",
        "Old Man Room": "M"
    }

    print("+" + ("-" * 3 + "+") * columns)

    for y in range(rows - 1, -1, -1):
        room_line = "|"
        for x in range(columns):
            room = board[(x, y)]
            symbol = room_symbols[room]

            if character["X-coordinate"] == x and character["Y-coordinate"] == y:
                room_display = f"*{symbol}*"
            else:
                room_display = f" {symbol} "

            room_line += room_display + "|"
        print(room_line)
        print("+" + ("-" * 3 + "+") * columns)


def getuserchoice():
    """
    Retrieve user choice

    Function that retrieves the users input of cardinal directions represented with only the first letter in lowercase form
    or 'map' to display the map or help to teach valid inputs.

    :postcondition: The function either returns a choice or prints a message that informs the user that they did not
    enter a valid input
    :return: User inputted direction if input is 1 of the 4 cardinal directions or 'map', and 'help', and 'quit' if not, return None
    """
    inputs = ["n", "s", "e", "w", "map", "help", "quit", "int", "item"]
    choice = input(
        "\nWhat would you like to do?\n").strip().lower()
    if choice in inputs:
        return choice
    else:
        print("You did not enter a valid input.")


def validatemove(board, character, direction):
    """
    Checks if direction is valid

    Function that validates if the given direction will not get the character to move out of the board

    :param board: A dictionary representing the game board, where keys are tuples of (row, column) indices and values
    are room types
    :precondition: board must be a dictionary with valid (row, column) keys and room type values
    :param character: A dictionary representing the character, containing "X-coordinate" and "Y-coordinate" keys
    :precondition: character must be a dictionary with "X-coordinate" and "Y-coordinate" keys
    :param direction: A string representing the users desired direction of movement
    :precondition: string must be one of the cardinal directions represented with only the first letter in lowercase form
    :postcondition: The function determines if the move is valid without modifying the character or board.
    :return: True if the move is valid (within bounds), False otherwise.

    >>> boardtest = {(0, 0): "Grassland Room", (0, 1): "Sleepy Room", (1, 0): "Empty Room", (1, 1): "Grassland Room"}
    >>> charactertest = {"X-coordinate": 0, "Y-coordinate": 0}
    >>> validatemove(boardtest, charactertest, "n")
    True
    >>> validatemove(boardtest, charactertest, "s")
    False
    >>> validatemove(boardtest, charactertest, "e")
    True
    >>> validatemove(boardtest, charactertest, "w")
    False
    """
    if direction == "n":
        new_coord = (character["X-coordinate"], character["Y-coordinate"] + 1)
        if new_coord < (0, 0) or new_coord not in board.keys():
            return False

    elif direction == "s":
        new_coord = (character["X-coordinate"], character["Y-coordinate"] - 1)
        if new_coord < (0, 0) or new_coord not in board.keys():
            return False

    elif direction == "e":
        new_coord = (character["X-coordinate"] + 1, character["Y-coordinate"])
        if new_coord < (0, 0) or new_coord not in board.keys():
            return False

    elif direction == "w":
        new_coord = (character["X-coordinate"] - 1, character["Y-coordinate"])
        if new_coord < (0, 0) or new_coord not in board.keys():
            return False

    return True


def handle_inventory(character):
    """
    Handle the character's inventory and allow potion usage.

    This function displays the current inventory of the character, shows potion options,
    and allows the player to use a potion to heal. It updates the character's HP and inventory accordingly.

    :param character: A dictionary representing the character, which must contain: "Inventory", "Current HP", "Max-HP" keys
    :precondition: character must have valid "Inventory", "Current HP", and "Max-HP" keys with appropriate values
    :postcondition: Updates the character's HP and inventory if a potion is used
    :return: The updated character dictionary
    """
    print("\nCurrent inventory:")
    if not character["Inventory"]:
        print("Your inventory is empty")
        return character

    # Show inventory
    potion_names = {
        "small_pot": "Small Potion (Heals 20 HP)",
        "medium_pot": "Medium Potion (Heals 50 HP)",
        "large_pot": "Large Potion (Heals 100 HP)"
    }

    for item_id, quantity in character["Inventory"].items():
        print(f"- {potion_names[item_id]}: {quantity}")

    print(f"\nCurrent HP: {character['Current HP']}/{character['Max-HP']}")
    print("\nWhich potion would you like to use?")
    print("1. Small Potion")
    print("2. Medium Potion")
    print("3. Large Potion")
    print("4. Back")

    choice = input("Enter your choice (1-4): ").strip()

    if choice == "4":
        return character

    potion_values = {
        "1": ("small_pot", 20),
        "2": ("medium_pot", 50),
        "3": ("large_pot", 100)
    }

    if choice in potion_values:
        pot_id, heal_amount = potion_values[choice]
        if character["Inventory"].get(pot_id, 0) > 0:
            character["Current HP"] = min(character["Max-HP"], character["Current HP"] + heal_amount)
            character["Inventory"][pot_id] -= 1
            if character["Inventory"][pot_id] == 0:
                del character["Inventory"][pot_id]
            print(f"\nUsed a potion! Current HP: {character['Current HP']}/{character['Max-HP']}")
        else:
            print("\nYou don't have any of that potion!")
    else:
        print("\nInvalid choice!")

    return character


def handle_upgrades(character):
    """
    Handle the upgrade system where players can spend experience points.

    Function that allows the player to spend their experience points to upgrade their character.
    The function continues to prompt the player until they choose to exit the upgrade room.

    :param character: A dictionary representing the character
    :precondition: character must contain valid numerical values for "Max-HP", "Current HP","Attack Pwr", and "Exp"
    :postcondition: Modifies the character's stats based on the player's upgrade choices
    :return: The updated character dictionary
    """
    while True:
        print(f"\nWelcome to the Upgrade Room!")
        print(f"Your current stats:")
        print(f"Max HP: {character['Max-HP']}")
        print(f"Attack Power: {character['Attack Pwr']}")
        print(f"Available Experience: {character['Exp']}")

        print("""
Available Upgrades:
------------------
1. Increase Max HP (+20) - Cost: 50 exp
2. Increase Attack Power (+5) - Cost: 75 exp
3. Exit
""")

        choice = input("Enter your choice (1-3): ").strip()

        if choice == "1":
            if character["Exp"] >= 50:
                character["Max-HP"] += 20
                character["Current HP"] += 20
                character["Exp"] -= 50
                print(f"\nMax HP increased! New Max HP: {character['Max-HP']}")
                print(f"Current HP increased to: {character['Current HP']}")
            else:
                print("\nNot enough experience points!")

        elif choice == "2":
            if character["Exp"] >= 75:
                character["Attack Pwr"] += 5
                character["Exp"] -= 75
                print(f"\nAttack Power increased! New Attack Power: {character['Attack Pwr']}")
            else:
                print("\nNot enough experience points!")

        elif choice == "3":
            print("\nCome back when you have more experience!")
            break
        else:
            print("\nInvalid choice!")

        print(f"\nRemaining experience: {character['Exp']}")

    return character


def handle_shopping(character):
    """
    Handle the shop system where players can buy potions using in-game money.

    Function that allows the player to purchase healing items from a shop using their available money.
    The function continues to prompt the player until they choose to exit the shop.

    :param character: A dictionary representing the character
    :precondition: character must contain a numerical "Money" value and optionally an "Inventory" dictionary
    :postcondition: Deducts money and adds purchased items to the character's inventory
    :return: The updated character dictionary
    """
    # Ensure inventory is a dictionary
    if not isinstance(character.get("Inventory"), dict):
        character["Inventory"] = {}

    shop_items = {
        "small_pot": {"name": "Small Potion", "price": 10, "description": "Restores 20 HP"},
        "medium_pot": {"name": "Medium Potion", "price": 25, "description": "Restores 50 HP"},
        "large_pot": {"name": "Large Potion", "price": 50, "description": "Restores 100 HP"}
    }

    while True:
        print("\nWelcome to the Shop!")
        print(f"Your current money: ${character['Money']}")
        print("\nAvailable items:")
        for item_id, item in shop_items.items():
            print(f"{item['name']} - ${item['price']} - {item['description']}")

        print("\nWhat would you like to buy?")
        print("1. Small Potion ($10)")
        print("2. Medium Potion ($25)")
        print("3. Large Potion ($50)")
        print("4. Exit shop")

        choice = input("\nEnter your choice (1-4): ").strip()

        if choice == "1":
            if character["Money"] >= 10:
                character["Money"] -= 10
                character["Inventory"]["small_pot"] = character["Inventory"].get("small_pot", 0) + 1
                print("You bought a Small Potion!")
            else:
                print("Not enough money!")
        elif choice == "2":
            if character["Money"] >= 25:
                character["Money"] -= 25
                character["Inventory"]["medium_pot"] = character["Inventory"].get("medium_pot", 0) + 1
                print("You bought a Medium Potion!")
            else:
                print("Not enough money!")
        elif choice == "3":
            if character["Money"] >= 50:
                character["Money"] -= 50
                character["Inventory"]["large_pot"] = character["Inventory"].get("large_pot", 0) + 1
                print("You bought a Large Potion!")
            else:
                print("Not enough money!")
        elif choice == "4":
            print("Thanks for shopping!")
            break
        else:
            print("Invalid choice!")

        print("\nCurrent inventory:")
        if character["Inventory"]:
            for item_id, quantity in character["Inventory"].items():
                item_name = shop_items[item_id]["name"] if item_id in shop_items else item_id
                print(f"- {item_name}: {quantity}")
        else:
            print("Your inventory is empty")
        print(f"Remaining money: ${character['Money']}")

    return character


def check_nondirection_inputs(user_input, character, board):
    """
    Check and handle non-directional inputs like map, help, quit, item, and interact.

    This function handles commands unrelated to movement. Depending on the input and
    game state, it may trigger actions such as showing the map, displaying help,
    exiting the game, interacting with NPCs or locations, or using items.

    :param user_input: a string command entered by the user
    :precondition user_input: must be a lowercase string matching a valid command
    :param character: a dictionary representing the player’s character
    :precondition character: must contain keys like "Current Section", "X-coordinate", "Y-coordinate", etc.
    :param board: a dictionary mapping (x, y) coordinates to room names
    :precondition board: must contain valid coordinate keys and room name values
    :postcondition: performs the side effect of interacting with the game state and returns True, False, "NEXT_FLOOR", or "GAME_COMPLETE"
    :return: a boolean or string indicating whether a valid non-directional command was processed
    """
    if user_input == "map":
        rows = max(y for x, y in board.keys()) + 1
        columns = max(x for x, y in board.keys()) + 1
        draw_map(board, character, rows, columns)
        return True

    if user_input == "help":
        if character["Current Section"] == "Portal":
            print("""
Movement
--------
You can input North (N), South (S), East (E), West (W)

Other
-----
Input 'map' to view the map
Input 'quit' to save and exit
Input 'help' to view this message again
Input 'int' to interact with the shop/upgrades/npcs
Input 'item' to view and use items
""")
        else:
            print("""
Movement
--------
You can input North (N), South (S), East (E), West (W)

Other
-----
Input 'map' to view the map
Input 'quit' to save and exit
Input 'help' to view this message again
Input 'int' to interact with the shop/portal
Input 'item' to view and use items
""")
        return True

    if user_input == "quit":
        save_character(character)
        print("\nGame saved. Thanks for playing!")
        sys.exit()

    if user_input == "item":
        handle_inventory(character)
        return True

    if user_input == "int":
        current_room = board[(character["X-coordinate"], character["Y-coordinate"])]
        if current_room == "Old Man Room":
            print("\nYou talk to the Old Man...\n")
            dialogue(character)
            return True
        elif character["Current Section"] == "Portal" and current_room == "Portal Room":
            print("\nYou interact with the portal...")
            print("The portal begins to glow and pull you in...")
            character["Current Section"] = "Main Game"
            return True
        elif character["Current Section"] == "Main Game" and current_room == "Portal Room":
            character["Floors Completed"] += 1
            if character["Floors Completed"] >= 3:
                print("""
╔════════════════════════════════════════╗
║        ENTERING BOSS CHAMBER           ║
║    Prepare for your final battle!      ║
╚════════════════════════════════════════╝
""")
                if handle_boss_battle(character, make_boss):
                    return "GAME_COMPLETE"
                else:
                    print("\nYou wake up on the floor of the lobby room...")
                    character["Current HP"] = character["Max-HP"]
                    character["Current Section"] = "Portal"
                    return True
            else:
                print(f"\nProceeding to floor {character['Floors Completed'] + 1}...")
                character["X-coordinate"] = 0
                character["Y-coordinate"] = 0
                character["Enemies Defeated"] = 0
                return "NEXT_FLOOR"
        elif current_room == "Shop":
            handle_shopping(character)
            return True
        elif current_room == "Upgrade Room":
            handle_upgrades(character)
            return True
        else:
            print("\nThere's nothing to interact with here.")
            return True

    return False 