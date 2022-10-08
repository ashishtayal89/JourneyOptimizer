# Journey Optimizer

This is a POC of the flow diagram creator based on vanila javascript.

# Demo

Refer [this link](https://journey-optimizer.herokuapp.com/) for a quick demo

# Run on local

```npm
git clone https://github.com/ashishtayal89/JourneyOptimizer.git

npm install

npm start
```

# Concept

Going throug these library conceptualy I think that creating a flow chart is based on how you maintain a configuration for each block and how you update it based on different mouse events.

### CASE 1 When you are adding a new block

1. **Mouse Down** : Things that happen in this phase

   - You create a clone.
   - Establish a relation of the block with the mouse position.
   - Create/Update a block configuration containing

   ```javascript
   block = {
     parent:, // To maintain the relation with other nodes
     childwidth:, // Used to compute the new coordinates when now node is added
     id:, // Identifier present in dom
     x:, // The x coordinates of block
     y:, // The y coordinates of block
     width: , // block width
     height: , // block height
   };
   ```

   - Update the main application that drag has started using a callback.

2. **Mouse Move** : Things that happen in this phase

   - Update the position ie left and top of block based on mouse x and mouse y based onthe relation extabled on mouse down.
   - Show indicator if a block comes near to another block.

3. **Mouse up** : Things that happen in this phase

   #### Case 1 If this is the first block

   - Add the node to the canvas
   - Update the block config

   #### Case 2 If this is a later block

   - Add the node to the canvas
   - Calculate the **childwidth** of each parent node up to the root node.
   - Draw arrow to the new node
   - Update the block config
   - Rearrange the nodes by iterating throught them and based on the **childwidth** of each parent.

### CASE 2 When you are rearranging and already existing block

This is work in progress and will complete asap.

# Important facts to consider.

1. There are some factors that need to considered while positioning a block like
   - Scroll of canvas. Need to add it to block position.
   - Scroll of window. Need to add it to block position.
   - Position of the canvas. If its not static then we need to take that into account while calculating the block position.
2. There should be ways to update the other part of the application about different trigger point in the library ie through callback. This way the application can update itself if need be.

# Inspiration

I have looked at some of the open source libraries like dragflow, flowchart, react-flow-chart, flowy before starting the POC.

# Future Plan

Will optimize this to handle edge cases and make it more performant. Will release as a npm package once it has basic features ready.
Will also release a react+typescript version of this library going forward.
