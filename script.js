/*
 * IDB Programming: A3 — a musical instrument : Metallic Wind Tube
 *
 * All of the code for your instrument goes in this file. It's split into sections:
 *   settings — the "fixed" parts of your program
 *   state    — the parts of your program that change over time
 *   sound    — the Tone.js instruments and effects
 *   update   — updates the state every 100ms, if necessary
 *   use      — uses the state to make sound and shapes every 100ms, if necessary
 *   controls — what happens when the player uses the pointer
 *   setup    — starts everything
 *
 
 *
 * Shapes come from shape.js: createShape() makes one, and its methods
 * (setPosition, setSize, setColour ...) change it.
 *
 * Tone.js documentation: https://tonejs.github.io/docs/15.1.22/
 */

import { createShape } from "./shape.js";

// ---------- Settings ----------
// Settings variables should contain all of the "fixed" parts of your programs
const notes = ["C6", "A5", "F5", "D5", "C5"];// notes for each tube to play
const tubeCount= 5;// how many tubes to create

// ---------- State ----------
// State variables are the parts of your program that change over time.
let tubes= []; // to store the tubes
let speeds=[];// store the speed s history
let averageSpeed=0;

let lastX= 0 ;
let lastY= 0 ;
let lastTime= 0 ;
// for hover , click-based pitch bending  and volume control
let hoveredIndex= -1 ; // Tracks which chime circle is currently being hovered (-1 if none since index start o)
let currentDetune = 0; // Stores the current pitch adjustment in cents (-1200 to 1200)
let currentVolume = 0; // Stores the current volume adjustment(in decibels -30 to 6 db)

let isDragging= false; // use to check the click and drag the mouse
let clapperX= 0;
let clapperY= 0 ;

// ---------- Sound ----------
// Make the instruments and plug them into the speakers.
const synth = new Tone.PolySynth(Tone.Synth).toDestination(); // can play several notes at once

// ---------- Update ----------
// Update the state. This is called every 100ms.
function update(){
   if (speeds.length>0){
    // .reduce() goes through the array and adds all the values together,starting from 0, to calculate the total
    // we calculate the average of all stored speeds in the array
     averageSpeed= speeds.reduce((a,b)=> a+b,0)/speeds.length;
   } else{
    //resets the average because there are no speeds to calculate.
    averageSpeed= 0;
   }
   setTimeout(update,100);
}

// ---------- Use ----------
function use(){
  animateTubes();
}

function animateTubes(){
  let time = performance.now()* 0.003; // Gets the current time and multiplies it by 0.003 to control the animation speed.
// Goes through every tube in the tubes array.
// currentTube is the tube being checked(callback parameter), and i is its position in the array.
  tubes.forEach((currentTube,i)=> {
      //// Skip this tube if it or its element is missing
           if(!currentTube|| !currentTube.element){return;}
           // Check if this is the tube being hovered over.
           if( i===hoveredIndex){
            // Multiplies the average pointer speed by 10 to control the movement size.
            // Math.min() makes sure the movement never goes above 20 pixels
              let movement = Math.min(20, averageSpeed * 10);
              // Math.sin() creates a smooth back-and-forth movement.
              // Multiplying time by 8 controls how quickly the tube sways.
              let offsetX = Math.sin(time * 8) * movement;
              // Move the hovered tube horizontally using the calculated offset.
           currentTube.element.style.transform = `translateX(${offsetX}px)`;
              // The translateX() function moves the tube horizontally, while the offsetX
              // variable determines the direction and distance in pixels.
              // A negative offsetX moves the tube left, and a positive offsetX moves it right.
           }else{
              // Moves all non-hovered tubes back to their normal position.
            currentTube.element.style.transform = "translateX(0px)";
           }
     })
     // Run the animation function again on the next browser frame.
     requestAnimationFrame(animateTubes);
}

// ---------- Controls (Event Handlers) ----------
function startSound(event) {
  Tone.start();
}
// called to reset and simplify the code
function resetSound(){
  // reset the pitch , volume and apply it to synthesizer
       currentDetune= 0 ;
      currentVolume =0 ;
      synth.set({detune :0 , volume:0 });
}
 function forgetOldestSpeed(){
  // remove the first element of the speeds array if it has any elements, otherwise return null
  speeds.length>0?speeds.shift():null;
 }
 function savePointerPosition(event){
    lastX = event.clientX;
    lastY = event.clientY;
 }

// play a notes when the pointer enters a tube
// event : information about the pointer event
// index: tells us which tube the pointer entered , we do this to use same function for different tubes through the index changing
function pointerEnterTube(event,index){
// to save which tube we entered
      hoveredIndex= index;

// reset the sound adjustements  to the start when entering a tube
     resetSound();
    synth.triggerAttack(notes[index]);
 //  change the color
      tubes[index].setColour(180,50,70);
}

// when leaving the tube
function pointerLeaveTube(event,index){

synth.triggerRelease(notes[index]);// stop the notes
tubes[index].setColour(200,20,50);// reset the colour of the tube

// only reset the sound if we left the currently hovered tube
if(hoveredIndex=== index){
       // remember that we are no longer hovering on the tube
       hoveredIndex=-1;
      // reset the pitch and volume
      resetSound();
}

}
function pointerDown(event) {
  // remember the pointer is being dragged
  isDragging= true ;

  // we store the pointer s starting position for the clapper
  clapperX = event.clientX;
  clapperY= event.clientY;

 // Store the starting position and time for speed calculations
 savePointerPosition(event);
  lastTime= performance.now();//stores the time of the previous measurement in miliseconds using performance .now , so we can calculate the time between movements.
}

 function pointerUp(){
  // we stopped the dragging so we set it to false
  isDragging= false;
  resetSound();
 }

 function pointerMove(event){
  // if we are not dragging the stop running this function
  if(!isDragging){return ; }

  // update the clapper s current  positions to follow the pointer to be stored
  clapperX= event.clientX;
  clapperY= event.clientY ;

  // get the current time in milliseconds
  const now = performance.now();

  // calculate how many seconds have passed since last measurement (convert  elapsed time to seconds)
  const seconds = (now - lastTime)/ 1000 ;

  // check the elapsed time  is invalid number we stop
  if( seconds <= 0 || !Number.isFinite(seconds)){ return;}

  // we calculate now the horizontal and vertical movement and normalizes the movement relative to the screen size
   let dx = (event.clientX-lastX)/window.innerWidth;
   let dy = (event.clientY-lastY)/window.innerHeight;

    // total distance moved and speed 
    let distance = Math.hypot(dx,dy);//calculates the straight-line distance moved by the pointer using its horizontal and vertical movement
    let speed = distance / seconds ;

 // onlychange the sound when hovering on a tube
     if(hoveredIndex !== -1){
      const deltaX = event.clientX - lastX;
      const deltaY = event.clientY - lastY;

       // Horizontal movement controls pitch.
      if (deltaX !== 0) {
      const pitchSensitivity = 15;
      const pitchChange = Math.abs(deltaX) * speed * pitchSensitivity;

      if (deltaX > 0) {
        currentDetune += pitchChange;
      } else {
        currentDetune -= pitchChange;
      }

      // now we limit the detune value within 1 octave up or down
        currentDetune= Math.max(-1200,Math.min(1200,currentDetune));// math.min makes sure we don t exceed 1200 and max makes sure we don t go below -1200
    }
        // Vertical movement controls volume.
    if (deltaY !== 0) {
      const volSensitivity = 1.5;
     // we make deltaY always absolute, speed never below 0.5 to avoid too small changes, and multiply by volSensitivity to control how much the volume changes.
      const volChange = Math.abs(deltaY) * Math.max(0.5, speed) * volSensitivity;

      if (deltaY < 0) {
        currentVolume += volChange; // Moving up increases volume.
      } else {
        currentVolume -= volChange; // Moving down decreases volume.
      }

       // let limit the volume same way [-30db,6db]
          currentVolume=Math.max(-30,Math.min(6,currentVolume));
    }
       // lets apply the detune(pitch) and volume values to the synthesizer.
          synth.set({detune:currentDetune,volume: currentVolume});
  }
     // Save the current position and time for the next movement.
        savePointerPosition(event);
         lastTime = now;
    // Store the speed and remove the old value after 500ms.
       speeds.push(speed);
       setTimeout(forgetOldestSpeed, 500);

 }

// ---------- Setup ----------
// Setup is run once, at the start of the program. It sets everything up for us!
function setup() {
  update(); // start the update loop
 use();
 // Create the five tubes.
    for (let i = 0; i < tubeCount; i++) {

        // Create a tube with a unique ID.
        let tube = createShape("tube-" + i);

        // Calculate the position and size of each tube.
        let posX = 0.2 + (i * 0.15);
        let posY = 0.3 + (i * 0.05);
        let size = 120 - (i * 15);

        // Set the tube's appearance.
        tube.setPosition(posX, posY);
        tube.setSize(size);
        tube.setColour(200, 15, 60);
        tube.setRoundedness(0.5);

        // Play a note when the pointer enters the tube.
        tube.element.addEventListener("pointerenter", function(event) {
            pointerEnterTube(event, i);
        });
        // Stop the note when the pointer leaves the tube.
        tube.element.addEventListener("pointerleave", function(event) {
            pointerLeaveTube(event, i);
        });
        // Store the tube in the tubes array.
        tubes.push(tube);
    }
  // Put your event listener code here
     // Listen for pointer events across the window.
    window.addEventListener("pointerdown", startSound);
    window.addEventListener("pointerdown", pointerDown);
    window.addEventListener("pointerup", pointerUp);
    window.addEventListener("pointermove", pointerMove);
}
setup(); // Always remember to call setup()!
