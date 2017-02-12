"use strict";

// keyCodes mapped to Electron accelerator codes
let keyCodes = {
    "8": "Backspace",
    "9": "Tab",
    "13": "Enter",
    "27": "Esc",
    "32": "Space",
    "33": "PageUp",
    "34": "PageDown",
    "35": "End",
    "36": "Home",
    "37": "Left",//ARROWLEFT
    "38": "Up",//ARROWUP
    "39": "Right",//ARROWRIGHT
    "40": "Down",//ARROWDOWN
    "44": "PrintScreen",
    "45": "Insert",
    "46": "Delete",
    "48": "0",
    "49": "1",
    "50": "2",
    "51": "3",
    "52": "4",
    "53": "5",
    "54": "6",
    "55": "7",
    "56": "8",
    "57": "9",
    "65": "A",
    "66": "B",
    "67": "C",
    "68": "D",
    "69": "E",
    "70": "F",
    "71": "G",
    "72": "H",
    "73": "I",
    "74": "J",
    "75": "K",
    "76": "L",
    "77": "M",
    "78": "N",
    "79": "O",
    "80": "P",
    "81": "Q",
    "82": "R",
    "83": "S",
    "84": "T",
    "85": "U",
    "86": "V",
    "87": "W",
    "88": "X",
    "89": "Y",
    "90": "Z",
    "112": "F1",
    "113": "F2",
    "114": "F3",
    "115": "F4",
    "116": "F5",
    "117": "F6",
    "118": "F7",
    "119": "F8",
    "120": "F9",
    "121": "F10",
    "122": "F11",
    "123": "F12",
    "124": "F13",
    "125": "F14",
    "126": "F15",
    "127": "F16",
    "128": "F17",
    "129": "F18",
    "130": "F19",
    "131": "F20",
    "132": "F21",
    "133": "F22",
    "134": "F23",
    "135": "F24",
    "173": "VolumeMute",//AudioVolumeMute
    "174": "VolumeDown",//AudioVolumeDown
    "175": "VolumeUp",//AudioVolumeUp
    "176": "MediaNextTrack",//MediaTrackNext
    "177": "MediaPreviousTrack",//MediaTrackPrevious
    "178": "MediaStop",
    "179": "MediaPlayPause",
    "186": ";",//SEMICOLON
    "187": "=",//EQUAL
    "188": ",",//COMMA
    "189": "-",//MINUS
    "190": ".",//PERIOD
    "191": "/",//SLASH
    "192": "`",//BACKQUOTE/BACKTICK
    "219": "[",//BRACKETLEFT
    "220": "\\",//BACKSLASH
    "221": "]",//BRACKETRIGHT
    "222": "'"//QUOTE
}

module.exports.getAccelerator = (KeyboardEvent) => {

    let accelerator = ``;
    let keyCode = KeyboardEvent.keyCode || KeyboardEvent.which; // 'which' is for Firefox support
    let shiftKey = KeyboardEvent.shiftKey;
    let ctrlKey = KeyboardEvent.ctrlKey;
    let altKey = KeyboardEvent.altKey;
    let metaKey = KeyboardEvent.metaKey;

    // Get key code
    let value = keyCodes[keyCode];

    // If keyCode is in keyCodes make accelerator, else return false
    if (value) {
        // Add modifiers
        if (shiftKey) accelerator += `Shift+`;
        if (ctrlKey) accelerator += `Ctrl+`;
        if (altKey) accelerator += `Alt+`;
        if (metaKey) accelerator += `Super+`;

        //and finally add a key code
        accelerator += value;

        //else make only modifier accelerator
    } else {
        return false;
    }
    return accelerator;
};