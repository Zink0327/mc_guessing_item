# Minecraft Guessing Item

## Introduction

Can you guess a hidden Minecraft item based on the crafting recipe?

## Game target

There is a target Minecraft item, and the guessing area provides its crafting recipe. You need to guess the target item based on the crafting recipe.

## How to play

- Select items to make a guess, and the system will show how many steps it takes to craft target from the item.
- Click on slots 1-9 in the main guessing area to see the crafting recipe for that slot.  
- All items are hidden at first and will show up in their spots once guessed.  
- Guess the target item correctly to win!

## Fuzzy matching

- System may ignore color words (white, orange, red, etc.), wood types (oak, spruce, etc.), and material words (dyed, polished, cut, etc.).
> For example: typing "red wool" may match "orange wool," and typing "red glass pane" may match "purple dyed glass pane."
- The guess log will show correct items with a distance less than 3, helping you understand crafting relationships.
> Distance display: distance indicates how many crafting steps away an item is from the answer; "far" means greater than 3.

## Other instructions

- Empty slots have a gray background and can't be clicked.
- Item info is up to Minecraft JE 1.20.5.
- Have fun!

## How to launch

To launch the game, first you need Node.js installed on your computer. Then in backend/ directory, run:

```
npm install
node server.js
```

And enjoy the game at the address http://localhost:4000/

## For developers

The server is developed with Node.js. The frontend is developed with Vue 3.

Due to time limitation, it may contain some buggy features. Feel free to make a pull request!

## License

This game is licensed under the terms of MIT license.

This game partly uses the icons from [themuhamed/mcicons](https://github.com/themuhamed/mcicons).