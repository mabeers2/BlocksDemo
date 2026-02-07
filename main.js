import experiment_data from './exp_dataset_test.json' assert {type: 'json'};
import overlay_dct from './color_dct.json' assert {type: 'json'};
const palette = Object.keys(overlay_dct);
// console.log("palette = ", palette)
const KEYPRESS_SPACEBAR = 0x20;
const KEYPRESS_P = 0x50;
const KEYPRESS_O = 0x4F;



function shuffleArray(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}


class Program {
  constructor(height, width, steps, id){
    this.height = height;
    this.width = width;
    this.steps = steps;
    this.id = id;
  }

  get length(){
    return this.steps.length;
  }

  get area(){
    let A = 0;
    for (let i = 0; i < this.length; i++){
      A += (this.steps[i][1] - this.steps[i][0]) * (this.steps[i][3] - this.steps[i][2])
    }
    return A
  }
  
  paint(){
    let canvas = Array(this.height).fill(-1).map(() => Array(this.width).fill(-1));
    for (let k = 0; k < this.length; k++){
      let current_color = this.steps[k][4];
      for (let i = this.steps[k][0]; i < this.steps[k][1]; i++){
        for (let j = this.steps[k][2]; j < this.steps[k][3]; j++){
          canvas[i][j] = current_color;
        }    
      }    
    }    
    return canvas
  }

  paint_with_palette(palette){
    let canvas = this.paint()
    for (let i = 0; i < this.height; i++){
      for (let j = 0; j < this.width; j++){
        canvas[i][j] = palette.at(canvas[i][j]);
      }    
    }    
    return canvas
  }
}

class UserProgram extends Program {
  constructor(height, width, id){
    super(height, width, [], id);
    this.all_steps = []; // Each entry in all_steps is of the format {"action":[ymin, ymax, xmin,xmax, color], "time":Date.now()}
  }

  paint_with_overlay(palette, overlay_img, overlay_dct){
    let canvas = this.paint_with_palette(palette) // current program image
    for (let i = 0; i < this.height; i++){
      for (let j = 0; j < this.width; j++){
        canvas[i][j] = overlay_dct[canvas[i][j]][overlay_img[i][j]];
      }
    }
    return canvas
  }

}

class Trial{
  constructor(target_program){
    this.target_program = target_program;
    this.user_program = new UserProgram(this.target_program.height, this.target_program.width, this.target_program.id)
    this.img_target = this.target_program.paint_with_palette(palette) // left side
    this.img_current = this.user_program.paint_with_palette(palette) // right side, overlay off
    this.img_current_plus_overlay = this.user_program.paint_with_overlay(palette, this.img_target, overlay_dct) //right side, overlay on
  }
}

class Experiment{
  constructor(experiment_data){
    this.num_trials = experiment_data.length;
    this.i = 0;
    this.order = shuffleArray(Array.from(Array(this.num_trials).keys()));
    this.trials = this.get_trials(experiment_data);
  }

  get_trials(experiment_data){
    var trials = [];
    var counter = 0;
    for (let i=0, len=this.num_trials; i<len; i++){
        trials.push(new Trial(
          new Program(
            experiment_data[i].height,
            experiment_data[i].width,
            experiment_data[i].steps,
            experiment_data[i].id
            )
          )
        );         
    }
    return trials
  }

  go_forward_one_trial(){
    if (this.i < this.num_trials - 1){
      this.i += 1;
    }
  }

  go_back_one_trial(){
    if (this.i > 0) {
      this.i -= 1;
    }
  }

  get k(){
    return this.order[this.i]
  }

  is_last_trial(){
    return this.i == (this.num_trials-1);
  }
}


function init(){ 
  // Init Button Grids 
  const left_container = document.getElementById('left_grid'); 
  const left_fragment = document.createDocumentFragment();  
  const right_container = document.getElementById('right_grid'); 
  const right_fragment = document.createDocumentFragment(); 
  for (let r = 0; r < exp.trials[exp.k].target_program.height; r++) {
    for (let c = 0; c < exp.trials[exp.k].target_program.width; c++) {
      const button = document.createElement('button');
      // Add Left Buttons
      button.title = `(${r + 1}, ${c + 1})`;
      button.id = `left(${r}, ${c})`
      button.disabled=true;
      button.style.backgroundColor = exp.trials[exp.k].img_target[r][c];
      left_fragment.appendChild(button);
      // Add Right Buttons
      const button2 = document.createElement('button');
      button2.title = `(${r + 1}, ${c + 1})`;
      button2.id = `(${r}, ${c})`;
      button2.style.backgroundColor = exp.trials[exp.k].img_current[r][c];
      right_fragment.appendChild(button2);
    }
  }
  left_container.appendChild(left_fragment);
  right_container.appendChild(right_fragment);
  // Init Color Container Buttons
  const color_container = document.getElementById('color_picker');
  for (let m = 0; m < palette.length-1; m++){
    const button3 = document.createElement('button');
    button3.style.backgroundColor = palette[m];
    button3.id = palette[m];
    // button3.classList.add("csc")
    color_container.appendChild(button3);
  }
  // Init Bottom Row of Navigation Buttons 
  const bottom_container = document.getElementById('bottom_row');
  // Add Clear Button
  const clear = document.createElement('button');
  clear.textContent = "Clear";
  clear.id = "clear";
  bottom_container.appendChild(clear);
  // Add Undo Button 
  const undo = document.createElement('button');
  undo.textContent = "Undo";
  undo.id = 'undo';
  bottom_container.appendChild(undo);
  // Add Button to toggle the overlay 
  const toggle_overlay = document.createElement('button');
  toggle_overlay.textContent = "Toggle Overlay";
  toggle_overlay.id = 'toggle';
  bottom_container.appendChild(toggle_overlay);
  // Add Button to submit & next trial 
  const submit = document.createElement('button');
  submit.textContent = "Submit + Next Trial";
  submit.id = "next";
  bottom_container.appendChild(submit);

}

function toggle_overlay(){
  if (overlay_on){
    for (let r = 0; r < exp.trials[exp.k].target_program.height; r++) {
      for (let c = 0; c < exp.trials[exp.k].target_program.width; c++) {
        const button2 = document.getElementById(`(${r}, ${c})`);
        button2.style.backgroundColor = exp.trials[exp.k].img_current[r][c];
      }
    }
    overlay_on = false;
  } else {
    for (let r = 0; r < exp.trials[exp.k].target_program.height; r++) {
      for (let c = 0; c < exp.trials[exp.k].target_program.width; c++) {
        const button2 = document.getElementById(`(${r}, ${c})`);
        button2.style.backgroundColor = exp.trials[exp.k].img_current_plus_overlay[r][c];
      }
    }
    overlay_on = true;
  }
}


function add_rectangle(r1,c1,r2,c2, col){
  const xmin = Math.min(c1, c2)
  const xmax = Math.max(c1, c2) + 1
  const ymin = Math.min(r1, r2)
  const ymax = Math.max(r1, r2) + 1
  const rect = [ymin, ymax, xmin, xmax, col];
  const rect_dct = {"action":rect.toString(), "time":Date.now()};
  exp.trials[exp.k].user_program.steps.push(rect);
  exp.trials[exp.k].user_program.all_steps.push(rect_dct);
  update_images()
}

function update_images(){
  exp.trials[exp.k].img_current = exp.trials[exp.k].user_program.paint_with_palette(palette) // right side, overlay off
  exp.trials[exp.k].img_current_plus_overlay = exp.trials[exp.k].user_program.paint_with_overlay(palette, exp.trials[exp.k].img_target, overlay_dct) //right side, overlay on
  if (overlay_on){
    for (let r = 0; r < exp.trials[exp.k].target_program.height; r++) {
      for (let c = 0; c < exp.trials[exp.k].target_program.width; c++) {
        const button2 = document.getElementById(`(${r}, ${c})`);
        button2.style.backgroundColor = exp.trials[exp.k].img_current_plus_overlay[r][c];
      }
    }
  } else {
    for (let r = 0; r < exp.trials[exp.k].target_program.height; r++) {
      for (let c = 0; c < exp.trials[exp.k].target_program.width; c++) {
        const button2 = document.getElementById(`(${r}, ${c})`);
        button2.style.backgroundColor = exp.trials[exp.k].img_current[r][c];
      }
    }
  }
}

function update_left_image(){
  for (let r = 0; r < exp.trials[exp.k].target_program.height; r++) {
    for (let c = 0; c < exp.trials[exp.k].target_program.width; c++) {
      const button = document.getElementById(`left(${r}, ${c})`);
      button.style.backgroundColor = exp.trials[exp.k].img_target[r][c];
    }
  }
}

function undoer(){
  if (exp.trials[exp.k].user_program.length > 0){
    exp.trials[exp.k].user_program.steps.pop();
    exp.trials[exp.k].user_program.all_steps.push({"action":"undo", "time":Date.now()})
    update_images()
  }
}

function clearer(){
  if (exp.trials[exp.k].user_program.length > 0){
    exp.trials[exp.k].user_program.steps = [];
    exp.trials[exp.k].user_program.all_steps.push({"action":"clear", "time":Date.now()})
    update_images()
  }
}

function submit_and_next_trial(){
  // Step 1: Check if user program and target program produce identical images. 
  const image_target = exp.trials[exp.k].target_program.paint();
  const image_user = exp.trials[exp.k].user_program.paint();
  var difference = [];
  for (let r = 0; r < exp.trials[exp.k].target_program.height; r++) {
    for (let c = 0; c < exp.trials[exp.k].target_program.width; c++) {
      if (image_user[r][c] != image_target[r][c]){
        difference.push(`(${r + 1}, ${c + 1})`);
      }
    }
  }
  // Step 2: Actions depending on this. 
  if (difference.length > 0){
    alert(`Failed to reproduce target at positions: ${difference.toString()}`)
  } else {
    if (exp.is_last_trial()){
      alert("Thank you for completing the demo!")
    } else {
      exp.go_forward_one_trial();
      update_images()
      update_left_image()
      const title_text = document.getElementById("title");
      title_text.innerHTML = `Trial ${exp.i+1} / ${exp.trials.length}`
    }
  }
}

var exp = new Experiment(experiment_data);
init()
var active_square = null;
var active_color = null;
var overlay_on = false;

document.addEventListener('click', (event) => {
  if (event.target && event.target.nodeName === 'BUTTON' && event.target.id.startsWith("rgb") && active_color === null){
    event.target.classList.add('clicked_color');
    active_color = event.target;
    console.log(active_color.id)
  } else if (event.target && event.target.nodeName === 'BUTTON' && event.target.id.startsWith("rgb") && active_color != null){
    active_color.classList.remove("clicked_color");
    event.target.classList.add('clicked_color');
    active_color = event.target;
    console.log(active_color.id)
  } else if (event.target && event.target.nodeName === 'BUTTON' && event.target.id === "toggle"){
    toggle_overlay()
  } else if (event.target && event.target.nodeName === 'BUTTON' && event.target.id.startsWith("(") && active_square === null){
    active_square = event.target;
    active_square.classList.add('clicked_square');
  } else if (event.target && event.target.nodeName === 'BUTTON' && event.target.id.startsWith("(") && active_square != null && active_color != null){
    active_square.classList.remove('clicked_square');
    const [r1, c1] = event.target.id.split(/[\W_]+/).slice(1,3).map(Number)
    const [r2, c2] = active_square.id.split(/[\W_]+/).slice(1,3).map(Number)
    add_rectangle(r1,c1,r2,c2,palette.indexOf(active_color.id));
    active_square = null;
  } else if (event.target && event.target.nodeName === 'BUTTON' && event.target.id === "undo"){
    undoer()
  } else if (event.target && event.target.nodeName === 'BUTTON' && event.target.id === "clear"){
    clearer()
  } else if (event.target && event.target.nodeName === 'BUTTON' && event.target.id === "next"){
    submit_and_next_trial()
  }
});




