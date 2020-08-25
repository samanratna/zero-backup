let el;
let Keyboard = window.SimpleKeyboard.default;
let myKeyboard = new Keyboard({
  onChange: input => onChange(input),
  onKeyPress: button => onKeyPress(button),
  mergeDisplay: true,
  // preventMouseDownDefault: true,
  layoutName: "default",
  layout: {
    default: [
      "q w e r t y u i o p",
      "a s d f g h j k l",
      "{shift} z x c v b n m {backspace}",
      "{numbers} {space} {ent}"
    ],
    shift: [
      "Q W E R T Y U I O P",
      "A S D F G H J K L",
      "{shift} Z X C V B N M {backspace}",
      "{numbers} {space} {ent}"
    ],
    numbers: ["1 2 3", "4 5 6", "7 8 9", "{abc} 0 {backspace}"]
  },
  display: {
    "{numbers}": "123",
    // "{ent}": "↵",
    "{ent}": "↵",
    "{escape}": "esc ⎋",
    "{tab}": "tab ⇥",
    "{backspace}": "⌫",
    // "{backspace}": "del",
    "{capslock}": "caps lock ⇪",
    "{shift}": "⇧",
    // "{shift}": "shift",
    "{controlleft}": "ctrl ⌃",
    "{controlright}": "ctrl ⌃",
    "{altleft}": "alt ⌥",
    "{altright}": "alt ⌥",
    "{metaleft}": "cmd ⌘",
    "{metaright}": "cmd ⌘",
    "{abc}": "ABC"
  }
});

function handleShift() {
  let currentLayout = myKeyboard.options.layoutName;
  let shiftToggle = currentLayout === "default" ? "shift" : "default";

  myKeyboard.setOptions({
    layoutName: shiftToggle
  });
}

function handleNumbers() {
  let currentLayout = myKeyboard.options.layoutName;
  let numbersToggle = currentLayout !== "numbers" ? "numbers" : "default";

  myKeyboard.setOptions({
    layoutName: numbersToggle
  });
}

function onChange(input) {
  document.querySelector(".mapboxgl-ctrl-geocoder--input").value = input;
  console.log("Input changed", input);
  triggerEvent('keydown');
}

function onKeyPress(button) {
  triggerEvent('keydown');
  if (button === "{shift}" || button === "{lock}") handleShift();
  if (button === "{numbers}" || button === "{abc}") handleNumbers();

  if(button == "{ent}"){
    console.log("Enter Pressed.");
    // closeKeyboard();
  }
}

let keyboardStatus = 'closed';
let keyboardHandle = document.getElementById('js-keyboard');
function openKeyboard() {
  if(keyboardStatus != 'closed'){
    return;
  }
  myKeyboard.clearInput();
  keyboardHandle.style.display = 'block';
  keyboardStatus = 'open';
}

function closeKeyboard() {
  console.log('closeKeyboard function called.')
  if(keyboardStatus != 'open'){
      return;
  }
  myKeyboard.clearInput();
  keyboardHandle.style.display = 'none';
  keyboardStatus = 'closed';
}

function triggerEvent(type){
  if ('createEvent' in document) {
       // modern browsers, IE9+
       var e = document.createEvent('HTMLEvents');
       e.initEvent(type, false, true);
       el.dispatchEvent(e);
   } else {
       // IE 8
       var e = document.createEventObject();
       e.eventType = type;
       el.fireEvent('on'+e.eventType, e);
   }
}
