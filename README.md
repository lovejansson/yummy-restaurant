# Yummy restaurant
A fine dining night at the yummy restaurant. 

## About
The art displays a restaurant simulation set at the Yummy Restaurant where Justin Bieber is performing live with his guitarrist Dan Kanter. On the playlist are the most loved acoustic songs including As long as you love me, Love yourself and Off my face. I created this because I really like the [Yummy music video](https://www.youtube.com/watch?v=8EJ3zbKTWQ8&list=RD8EJ3zbKTWQ8&start_radio=1), and I thought its candy-funny-food vibe would be fun to turn into a pixel art simulation.

## How it works 

The program is written in Vanilla Javascript using the work-in-progress 'pim-art' library. Down below is an overview of the core systems that make up the scene.

### State classes for lifecycle and actions 

A *sprite*’s (2D image or animation in the scene, i.e. one of the guests or waiters) current goal and behaviour are defined by its state. The lifecycle state determines which general state it is in, for example, the Waiter can ServeOrder and the Guest can EatAndDrink. 

The action state is controlling how the sprite moves. A Sprite can walk, sit idle, stand idle, eat, drink and so on. The action state is in turn controlled by the lifecycle states. 

All of the states are represented by a class and whenever a sprite enters a new state a new state instance is created. This felt like the cleaner approach compared to keeping all state objects alive and resetting internal variables when transitioning between states. 

### Restaurant Events 

The events array stores Restaurant Events which is the work load for the waiters. 

The flow starts with a group of guests firing an event when they need service, for example when they want to order food. The waiters will read the first item in the events array while in Wait state and transition to the appropriate new state, in this case TakingOrder. The full list of Restaurant Events is ”arrive,order-food,bill”. 

### Messaging 

The sprites can send messages to each other via a messaging inbox. Each sprite sends a message via a function and supplies arguments for ”to” ”from” and ”content”. Sprites receive messages by checking if the inbox has something for them. This is used when the guests and waiters are talking to each other. 

### Path finding 

Path finding is a technique for creating paths in a grid system. In this case the A* algorithm is used to generate the paths from start to end whenever the sprites are walking somewhere. I had some issues with sprites overlapping due to the scene being so small that the sprites walked into each other a lot. I decided to go for an easy solution by preventing guests and waiters to walk at the same time or coordinating the start of the walks when they walk together, for example when a waiter is showing the guests to their table.
