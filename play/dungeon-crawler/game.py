import random

from characters import (
    make_character, 
    save_character, 
    load_character, 
    get_enemy_cycle,
    isalive, 
    move_character
)

from combat import (
    guessing_game,
    check_for_enemy
)


from inputs import (
    getuserchoice,
    validatemove,
    check_nondirection_inputs,
)


def make_board(rows: int, columns: int, floor_number: int) -> dict:
    """
    Create a game board with themed rooms based on floor number.

    Creates a game board represented as a dictionary with randomly assigned rooms.
    Ensures there is exactly one shop in the game.

    :param rows: The number of rows in the game board.
    :precondition: rows must be a positive integer greater than 0.
    :param columns: The number of columns in the game board.
    :precondition: columns must be a positive integer greater than 0.
    :param floor_number: The current floor number that determines room themes
    :precondition: floor_number must be an integer between 1 and 3
    :postcondition: The function returns a dictionary representing the game board, where keys are
    tuples of (row, column) indices and values are randomly chosen room types.
    :return: A dictionary representing the game board.
    """
    emptydict = {}

    floor_rooms = {
        1: ["Empty Room", "Dusty Room", "Dirty Room", "Dark Room", "Cobweb Room"],  # Dungeon theme
        2: ["Grassland Room", "Forest Room", "Jungle Room", "Nest Room", "Den Room"],  # Animal kingdom theme
        3: ["Dojo Room", "Garden Room", "Temple Room", "Shrine Room", "Palace Room"]   # Japan theme
    }

    roomlist = floor_rooms.get(floor_number)
    
    # Fill the board with random themed rooms
    for index in range(rows):
        for windex in range(columns):
            emptydict[(index, windex)] = random.choice(roomlist)
    
    # Place one shop at a random location
    shop_location = (random.randint(0, rows-1), random.randint(0, columns-1))
    emptydict[shop_location] = "Shop"
    
    return emptydict


def describe_current_location(board, character):
    """
    Describe the current location of the character.

    Function that prints a description of the character's current location on the game board,
    including the room type and coordinates.

    :param board: A dictionary representing the game board, where keys are tuples of (row, column) indices and values
    are room types
    :precondition: board must be a dictionary with valid (row, column) keys and room type values
    :param character: A dictionary representing the character, containing "X-coordinate" and "Y-coordinate" keys
    :precondition: character must be a dictionary with "X-coordinate" and "Y-coordinate" keys
    :postcondition: The function prints a description of the character's current location.
    :return: None

    >>> board_test = {(0, 0): "Grassland Room", (0, 1): "Sleepy Room", (1, 0): "Empty Room", (1, 1): "Grassland Room"}
    >>> character_test = {"X-coordinate": 0, "Y-coordinate": 0}
    >>> describe_current_location(board_test, character_test)
    You are in 'Grassland Room' and your coordinates are (0, and 0)
    """
    roomlocation = board[character["X-coordinate"], character["Y-coordinate"]]
    print(f"You are in '{roomlocation}' and your coordinates are ({character["X-coordinate"]}, "
          f"and {character["Y-coordinate"]})")


def make_portal_board() -> dict:
    """
    Create a preset portal board with specific room layouts.

    Creates a 5x5 board with empty rooms and places special rooms in specific locations:
    - Portal Room in the center (2,2)
    - Shop in the top middle (0,2)
    - Upgrade Room in the bottom middle (4,2)
    - Old Man Room in the top left area (0,1)
    All other rooms are Empty Rooms.

    :postcondition: Creates a dictionary representing the portal board with specific room placements
    :return: A dictionary representing the portal board with coordinates as keys and room types as values

    >>> make_portal_board()
    {(0, 0): 'Empty Room', (0, 1): 'Old Man Room', (0, 2): 'Shop', (0, 3): 'Empty Room', (0, 4): 'Empty Room', (1, 0): 'Empty Room', (1, 1): 'Empty Room', (1, 2): 'Empty Room', (1, 3): 'Empty Room', (1, 4): 'Empty Room', (2, 0): 'Empty Room', (2, 1): 'Empty Room', (2, 2): 'Portal Room', (2, 3): 'Empty Room', (2, 4): 'Empty Room', (3, 0): 'Empty Room', (3, 1): 'Empty Room', (3, 2): 'Empty Room', (3, 3): 'Empty Room', (3, 4): 'Empty Room', (4, 0): 'Empty Room', (4, 1): 'Empty Room', (4, 2): 'Upgrade Room', (4, 3): 'Empty Room', (4, 4): 'Empty Room'}
    """
    portal_board = {(x, y): "Empty Room" for x in range(5) for y in range(5)}
    
    # Special room placements
    portal_board[(2, 2)] = "Portal Room"
    portal_board[(0, 2)] = "Shop"
    portal_board[(4, 2)] = "Upgrade Room"
    portal_board[(0, 1)] = "Old Man Room"
    return portal_board


def place_portal(board, rows, columns):
    """
    place a portal room in the center of the given board.

    :param board: A dictionary representing the game board
    :precondition: board must be a valid game board dictionary
    :param rows: Number of rows in the board
    :param columns: Number of columns in the board
    :precondition: rows and columns must be positive integers
    :postcondition: Updates the board with a portal room in the center
    :return: Updated board with portal placed in the middle

    >>> test_board = {(0, 0): 'Empty Room', (0, 1): 'Empty Room', (0, 2): 'Shop', (1, 0): 'Empty Room', (1, 1): 'Empty Room', (1, 2): 'Empty Room', (2, 0): 'Empty Room', (2, 1): 'Empty Room', (2, 2): 'Empty Room'}
    >>> place_portal(test_board, 3, 3)
    {(0, 0): 'Empty Room', (0, 1): 'Empty Room', (0, 2): 'Shop', (1, 0): 'Empty Room', (1, 1): 'Portal Room', (1, 2): 'Empty Room', (2, 0): 'Empty Room', (2, 1): 'Empty Room', (2, 2): 'Empty Room'}
    """
    middle_x = rows // 2
    middle_y = columns // 2
    board[(middle_x, middle_y)] = "Portal Room"
    return board


def game():
    """
    Drives the game
    """
    rows = 5
    columns = 5
    board = make_board(rows, columns, 1)
    current_enemy_cycle = None  # Initialize at start
    
    # Ask user if they want to start a new game or load an existing one
    while True:
        choice = input("\nWould you like to:\n1. Start a new game\n2. Load existing game\nEnter 1 or 2: ").strip()
        if choice in ["1", "2"]:
            break
        else:
            print("Please enter either 1 or 2.")
    
    if choice == "1":
        character = make_character()
        print("\nStarting new game...")
        save_character(character)
    else:
        character = load_character()
        print("\nLoading existing game...")
    
    achievedgoal = False

    # Print initial instructions
    print("\nInput 'help' to learn commands.")

    # Main game loop
    while not achievedgoal:
        if character["Current Section"] == "Portal":
            # Portal section handling
            portal_board = make_portal_board()

            while True:
                describe_current_location(portal_board, character)
                user_input = getuserchoice()

                if check_nondirection_inputs(user_input, character, portal_board):
                    if character["Current Section"] == "Main Game":
                        break  # Exit portal section
                    continue

                validmove = validatemove(portal_board, character, user_input)
                if validmove:
                    move_character(character, user_input)
                    if portal_board[(character["X-coordinate"], character["Y-coordinate"])] == "Portal Room":
                        print("\nYou've found the portal room!")
                        print("Interact with the portal to enter the main game!")
                else:
                    print("\nYou Bumped into a Wall, Try again.")

            current_enemy_cycle = None

        elif character["Current Section"] == "Main Game":
            # Dungeon section handling
            describe_current_location(board, character)
            user_input = getuserchoice()

            result = check_nondirection_inputs(user_input, character, board)
            if result == "GAME_COMPLETE":
                achievedgoal = True
                continue
            elif result == "NEXT_FLOOR":
                current_floor = character["Floors Completed"] + 1
                board = make_board(rows, columns, current_floor)
                current_enemy_cycle = None
                continue
            elif result:
                continue

            validmove = validatemove(board, character, user_input)
            if validmove:
                move_character(character, user_input)
                current_room = board[(character["X-coordinate"], character["Y-coordinate"])]
                
                if current_room == "Portal Room":
                    print("\nYou've found the portal! Interact with it to proceed to the next floor.")

                if current_room != "Portal Room" and (check_for_enemy() or character["Enemies Defeated"] >= 3):
                    if current_enemy_cycle is None:
                        current_enemy_cycle = get_enemy_cycle(character["Floors Completed"] + 1)
                    
                    enemy = next(current_enemy_cycle)
                    print(f"\nA {enemy['name']} appears!")
                    while enemy["Current HP"] > 0:
                        guessing_game(character, enemy)
                        if character["Current HP"] <= 0:
                            break
                        elif enemy["Current HP"] <= 0:
                           character["Money"] += enemy["Money"]
                           character["Exp"] += enemy["Exp"]
                           character["Enemies Defeated"] += 1
                           print(f"You gained ${enemy['Money']} and {enemy['Exp']} Dungeon Experience.")
                           print(f"Enemies defeated: {character['Enemies Defeated']}/3")
                           
                           if character["Enemies Defeated"] == 3:
                               print("\nA portal has appeared in the middle of the dungeon!")
                               board = place_portal(board, rows, columns)
                               current_enemy_cycle = None
            else:
                print("\nYou Bumped into a Wall, Try again.")

        if not isalive(character):
            print("\nYou died...\n\nBut you wake up on the floor of the portal room")
            character["Current HP"] = character["Max-HP"]
            character["Current Section"] = "Portal"
            current_enemy_cycle = None  # Reset enemy cycle
    else:
        print("\nYou won!")


def main():
    """
    Drive the program.
    """
    print("Welcome to Nates Simple Game")
    userinput = input("Press ENTER to continue...\n")
    if userinput == "":
        game()


if __name__ == "__main__":
    main()
