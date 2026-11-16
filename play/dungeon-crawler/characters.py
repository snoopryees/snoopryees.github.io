import json
from itertools import cycle

"""
File that handles all character related functionality
"""

def make_character():
    """
    Create a character dictionary.

    A function that generates a dictionary representing a character with default attributes:
    - X-coordinate: 0
    - Y-coordinate: 0
    - Current HP: 100
    - Max-HP: 100
    - Attack Pwr: 10

    :postcondition: The function returns a dictionary representing the character with default attributes.
    :return: A dictionary representing the character.

    >>> make_character()
    {'X-coordinate': 0, 'Y-coordinate': 0, 'Current HP': 100, 'Max-HP': 100, 'Attack Pwr': 10, 'Current Section': 'Portal', 'Money': 0, 'Exp': 0, 'Inventory': {}, 'Floors Completed': 0, 'Enemies Defeated': 0}
    """
    characterdict = {
        "X-coordinate": 0, 
        "Y-coordinate": 0, 
        "Current HP": 100, 
        "Max-HP": 100,
        "Attack Pwr": 10, 
        "Current Section": "Portal", 
        "Money": 0, 
        "Exp": 0, 
        "Inventory": {}, 
        "Floors Completed": 0, 
        "Enemies Defeated": 0
    }
    return characterdict


def save_character(character, filename="character_save.json"):
    """
    Save the character's state to a JSON file.

    This function saves the character's current state (coordinates and HP) to a JSON file.
    If the file already exists, it will be overwritten.

    :param character: A dictionary representing the character with coordinates and HP
    :precondition: character must be a dictionary with "X-coordinate", "Y-coordinate", and "Current HP" keys
    :param filename: The name of the file to save the character data to (default: "character_save.json")
    :postcondition: The character's state is saved to a JSON file
    :return: None
    """
    with open(filename, 'w') as save_file:
        json.dump(character, save_file, indent=6)
        # PyCharm warns: Expected type 'SupportsWrite[str]', got 'TextIO' instead.
        # This is a false positive; 'TextIO' from open() in write mode is valid for json.dump().
    print(f"\nCharacter saved.")


def load_character(filename="character_save.json"):
    """
    Load the character's state from a JSON file.

    This function loads the character's state from a JSON file if it exists.
    If the file doesn't exist, it creates a new character with default values.

    :param filename: The name of the file to load the character data from (default: "character_save.json")
    :postcondition: Returns either the loaded character state or a new character if no save exists
    :return: A dictionary representing the character
    """
    try:
        with open(filename, 'r') as load_file:
            character = json.load(load_file)
        print(f"\nCharacter loaded successfully.")
        character["X-coordinate"] = 0
        character["Y-coordinate"] = 0
        character["Current Section"] = "Portal"
        character["Floors Completed"] = 0
        return character
    except FileNotFoundError:
        print("\nNo save file found. Creating new character.")
        return make_character()


def get_enemy_cycle(floor):
    """
    Get the appropriate enemy cycle based on floor number.

    This function returns an iterator that cycles through a list of enemies specific to the floor number.

    :param floor: Current floor number (1-3)
    :precondition: floor must be an integer between 1 and 3
    :postcondition: Returns an iterator that cycles through the appropriate enemy list
    :return: An iterator that cycles through the floor's enemies, each enemy being a dictionary with name, HP, Attack, Money and Exp
    >>> enemy_cycle = get_enemy_cycle(1)
    >>> next(enemy_cycle)
    {'name': 'Slime', 'Current HP': 15, 'Attack Pwr': 8, 'Money': 8, 'Exp': 8}
    >>> next(enemy_cycle)
    {'name': 'Goblin', 'Current HP': 20, 'Attack Pwr': 10, 'Money': 10, 'Exp': 10}
    >>> next(enemy_cycle)
    {'name': 'Skeleton', 'Current HP': 25, 'Attack Pwr': 12, 'Money': 12, 'Exp': 12}
    """
    floor_enemies = {
        1: cycle([
            {"name": "Slime", "Current HP": 15, "Attack Pwr": 8, "Money": 8, "Exp": 8},
            {"name": "Goblin", "Current HP": 20, "Attack Pwr": 10, "Money": 10, "Exp": 10},
            {"name": "Skeleton", "Current HP": 25, "Attack Pwr": 12, "Money": 12, "Exp": 12}
        ]),
        2: cycle([
            {"name": "Viper", "Current HP": 30, "Attack Pwr": 15, "Money": 15, "Exp": 15},
            {"name": "Snake", "Current HP": 35, "Attack Pwr": 18, "Money": 18, "Exp": 18},
            {"name": "Penguin", "Current HP": 40, "Attack Pwr": 20, "Money": 20, "Exp": 20}
        ]),
        3: cycle([
            {"name": "Ninja", "Current HP": 45, "Attack Pwr": 25, "Money": 25, "Exp": 25},
            {"name": "Samurai", "Current HP": 50, "Attack Pwr": 28, "Money": 28, "Exp": 28},
            {"name": "Shogun", "Current HP": 55, "Attack Pwr": 30, "Money": 30, "Exp": 30}
        ])
    }
    return floor_enemies.get(floor)


def make_boss():
    """
    Create the final boss dictionary.

    A function that generates a dictionary representing the final boss with powerful attributes:
    - Name: Bald Man
    - Current HP: 200
    - Attack Pwr: 40
    - Money: 1000
    - Exp: 1000

    :postcondition: The function returns a dictionary representing the boss with its attributes
    :return: A dictionary representing the boss
    """
    boss = {
        "name": "Bald Man",
        "Current HP": 200,
        "Attack Pwr": 40,
        "Money": 1000,
        "Exp": 1000
    }
    return boss


def isalive(character):
    """
    Check if the character is alive.

    This function checks if the character's HP is greater than 0.

    :param character: A dictionary representing the character, containing "Current HP" key.
    :precondition: character must be a dictionary with "Current HP" key and an integer as the value.
    :postcondition: The function determines if the character is alive.
    :return: True if the character is alive, otherwise False.
    """
    if character["Current HP"] <= 0:
        return False
    return True


def move_character(character, direction):
    """
    Move the character in the specified direction.

    This function updates the character's coordinates based on the given direction.
    The character's "X-coordinate" and "Y-coordinate" are modified accordingly.

    :param character: A dictionary representing the character, containing "X-coordinate" and "Y-coordinate" keys.
    :precondition: character must be a dictionary with "X-coordinate" and "Y-coordinate" keys.
    :param direction: A string representing the user's desired direction of movement.
    :precondition: direction must be one of the cardinal directions represented with only the first letter in lowercase
                  form (e.g., "n", "s", "e", "w").
    :postcondition: The character's coordinates are updated based on the direction.
    :return: The updated character dictionary.
    """
    directions = ["n", "s", "e", "w"]

    if direction == directions[0]:
        character["Y-coordinate"] += 1
    elif direction == directions[1]:
        character["Y-coordinate"] -= 1
    elif direction == directions[2]:
        character["X-coordinate"] += 1
    elif direction == directions[3]:
        character["X-coordinate"] -= 1

    return character 