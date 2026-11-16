import random

"""
File that handles all combat related functions
"""

def guessing_game(character, enemy):
    """
    Play a guessing game with the user.

    This function prompts the user to play rock paper scissors. If the guess is incorrect,
    the character takes damage HP. If the guess is correct, the enemy takes damage

    :param enemy: A dictionary representing the enemy, containing "Current HP" key and "Current Damage" key.
    :precondition: must be a dictionary with "Current HP" key and "Current Damage" key with integer values.
    :param character: A dictionary representing the character, containing "Current HP" key and "Current Damage" key.
    :precondition: must be a dictionary with "Current HP" key and "Current Damage" key with integer values.
    :postcondition: The character's HP is updated based on the outcome of the guessing game.
    :return: The updated character dictionary.
    """
    choices = ['rock', 'paper', 'scissors']
    choice_map = {
        'r': 'rock',
        'p': 'paper',
        's': 'scissors',
        'rock': 'rock',
        'paper': 'paper',
        'scissors': 'scissors'
    }
    winningpairs = [('rock', 'scissors'), ('scissors', 'paper'), ('paper', 'rock')]
    enemy_choice = random.choice(choices)
    player_input = input("\nPick either '(r)ock', '(p)aper', '(s)cissors'\n").strip().lower()

    if player_input in choice_map:
        player_choice = choice_map[player_input]
        pair = player_choice, enemy_choice
        if player_choice == enemy_choice:
            print("You tied against the enemy!\n")
        elif pair in winningpairs:
            print("You won against the enemy!\n")
            enemy["Current HP"] -= character["Attack Pwr"]
            print("Your enemies HP is now:", enemy["Current HP"])
        else:
            print("You lost against the enemy...\n")
            character["Current HP"] -= enemy["Attack Pwr"]
            print("Your current HP is now:", character["Current HP"])
    else:
        print("You did not enter a valid choice.\n")
        character["Current HP"] -= 50
        print("Your current HP is now:", character["Current HP"])

    return character


def handle_boss_battle(character, make_boss):
    """
    Handle the final boss battle sequence.

    :param character: A dictionary representing the character with stats and inventory
    :precondition: character must be a dictionary containing "Current HP", "Money", and "Exp" keys
    :param make_boss: A function that creates and returns the boss dictionary
    :precondition: make_boss must be a callable that returns a dictionary with boss stats
    :postcondition: Updates character's HP, money, and experience based on battle outcome
    :return: True if the boss was defeated, False if the player died
    """
    boss = make_boss()
    print("""
╔════════════════════════════════════════╗
║           FINAL BOSS BATTLE            ║
║                                        ║
╚════════════════════════════════════════╝
""")
    print(f"The bald man appears before you!")
    print("\nPrepare for battle!")

    while boss["Current HP"] > 0:
        guessing_game(character, boss)
        if character["Current HP"] <= 0:
            return False

        if boss["Current HP"] <= 0:
            print("""
╔════════════════════════════════════════╗
║         BOSS BATTLE VICTORY!           ║
║                You Win!                ║
╚════════════════════════════════════════╝
""")
            character["Money"] += boss["Money"]
            character["Exp"] += boss["Exp"]
            print(f"\nYou gained ${boss['Money']} and {boss['Exp']} Experience!")
            return True

    return False


def check_for_enemy():
    """
    Check if the character encounters a foe.

    A function that determines if the character encounters a foe with a 25% chance.

    :postcondition: The function returns True if a foe is encountered, otherwise False.
    :return: True if a foe is encountered, otherwise False.
    """
    randnum = random.randint(1, 4)
    return randnum == 4 