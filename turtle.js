// get a handle for the canvases in the document
var imageCanvas = $('#imagecanvas')[0];
var imageContext = imageCanvas.getContext('2d');

imageContext.textAlign = "center";
imageContext.textBaseline = "middle";

var turtleCanvas = $('#turtlecanvas')[0];
var turtleContext = turtleCanvas.getContext('2d');

// the turtle takes precedence when compositing
turtleContext.globalCompositeOperation = 'destination-over';

// initialise the state of the turtle
var turtle = undefined;
var image_cache = undefined;

async function loadImages(imageUrlArray) {
    const promiseArray = []; // create an array for promises
    const imageArray = []; // array for the images

    for (let imageUrl of imageUrlArray) {

        promiseArray.push(new Promise(resolve => {

            const img = new Image();
            // if you don't need to do anything when the image loads,
            // then you can just write img.onload = resolve;

            img.onload = function () {
                // do stuff with the image if necessary

                // resolve the promise, indicating that the image has been loaded
                resolve();
            };

            img.src = imageUrl;
            imageArray.push(img);
        }));
    }

    await Promise.all(promiseArray); // wait for all the images to be loaded
    console.log("all images loaded");
    return imageArray;
}

function initialise() {
    turtle = {
        pos: {
            x: 0,
            y: 0
        },
        angle: 0,
        roll: 0,
        penDown: false,
        width: 4,
        visible: true,
        fade: 100,
        redraw: true, // does this belong here?
        wrap: false,
        color: {
            r: 255,
            g: 128,
            b: 255,
            a: 1
        },
        speed: 1,
        image: image_cache[0],
        images: image_cache,
    };
    imageContext.lineWidth = turtle.width;
    imageContext.strokeStyle = "black";
    imageContext.globalAlpha = 1;
    imageContext.lineCap = "round"
}

// draw the turtle and the current image if redraw is true
// for complicated drawings it is much faster to turn redraw off
function drawIf() {
    if (turtle.redraw) draw();
}

// use canvas centered coordinates facing upwards
function centerCoords(context) {
    var width = context.canvas.width;
    var height = context.canvas.height;
    context.translate(width / 2, height / 2);
    context.transform(1, 0, 0, -1, 0, 0);
}

// draw the turtle and the current image
function draw() {
    clearContext(turtleContext);
    if (turtle.visible) {
        var x = turtle.pos.x;
        var y = turtle.pos.y;
        var w = 10;
        var h = 12;
        var off = 32
        var temmie_half_size = 32
        var d = 5

        turtleContext.save();
        // use canvas centered coordinates facing upwards
        centerCoords(turtleContext);


        // draw temmie
        turtleContext.translate(x, y);
        turtleContext.transform(1, 0, 0, -1, 0, 0);
        turtleContext.globalAlpha = turtle.fade / 100
        turtleContext.rotate(-turtle.roll);
        turtleContext.drawImage(turtle.image, -temmie_half_size, -temmie_half_size)
        turtleContext.rotate(turtle.roll);
        turtleContext.transform(1, 0, 0, -1, 0, 0);
        turtleContext.translate(-x, -y);

        // move the origin to the turtle center
        turtleContext.translate(x, y);
        // rotate about the center of the turtle
        turtleContext.rotate(-turtle.angle);
        // move the turtle back to its position
        turtleContext.translate(-x, -y);



        // draw the turtle icon
        turtleContext.beginPath();
        turtleContext.moveTo(x, y + h + off);
        turtleContext.lineTo(x - w / 2, y + off);
        turtleContext.moveTo(x, y + h + off);
        turtleContext.lineTo(x + w / 2, y + off);
        turtleContext.moveTo(x, y + h + off);
        turtleContext.lineTo(x, y + off - d);

        turtleContext.closePath();

        turtleContext.lineWidth = 2
        turtleContext.stroke();

        //turtleContext.fillStyle = "white";
        //turtleContext.fill();

        turtleContext.globalAlpha = 1.0

        turtleContext.restore();
    }
    turtleContext.drawImage(imageCanvas, 0, 0, 300, 300, 0, 0, 300, 300);
}

// clear the display, don't move the turtle
function clear() {
    clearContext(imageContext);
    drawIf();
}

function clearContext(context) {
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.restore();
}

// reset the whole system, clear the display and move turtle back to
// origin, facing the Y axis.
function reset() {
    initialise();
    clear();
    draw();
}

// Trace the forward motion of the turtle, allowing for possible
// wrap-around at the boundaries of the canvas.
function forward(distance) {
    imageContext.save();
    centerCoords(imageContext);
    imageContext.beginPath();
    // get the boundaries of the canvas
    var maxX = imageContext.canvas.width / 2;
    var minX = -imageContext.canvas.width / 2;
    var maxY = imageContext.canvas.height / 2;
    var minY = -imageContext.canvas.height / 2;

    var draw_off_x = -1;
    var draw_off_y = -18

    var x = turtle.pos.x + draw_off_x;
    var y = turtle.pos.y + draw_off_y;
    // trace out the forward steps
    while (distance > 0) {
        // move the to current location of the turtle
        imageContext.moveTo(x, y);
        // calculate the new location of the turtle after doing the forward movement
        var cosAngle = Math.cos(turtle.angle);
        var sinAngle = Math.sin(turtle.angle)
        var newX = x + sinAngle * distance;
        var newY = y + cosAngle * distance;
        // don't wrap the turtle on any boundary
        function noWrap() {
            imageContext.lineTo(newX, newY);
            turtle.pos.x = newX - draw_off_x;
            turtle.pos.y = newY - draw_off_y;
            distance = 0;
        }
        noWrap();
    }
    // only draw if the pen is currently down.
    if (turtle.penDown) {
        var r = turtle.color.r
        var g = turtle.color.g
        var b = turtle.color.b
        var a = turtle.color.a
        imageContext.strokeStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
        imageContext.stroke();
    }
    imageContext.restore();
    drawIf();
}

// turn edge wrapping on/off
function wrap(bool) {
    turtle.wrap = bool;
}

// show/hide the turtle
function hideTurtle(fade) {
    //turtle.visible = false;
    turtle.fade -= fade
    turtle.fade = Math.max(turtle.fade, 0)
    drawIf();
}

// show/hide the turtle
function showTurtle(fade) {
    //turtle.visible = true;
    turtle.fade += fade
    turtle.fade = Math.min(turtle.fade, 100)
    drawIf();
}

// turn on/off redrawing
function redrawOnMove(bool) {
    turtle.redraw = bool;
}

// lift up the pen (don't draw)
function penup() {
    turtle.penDown = false;
    turtle.image = turtle.images[0]
    drawIf();
}
// put the pen down (do draw)
function pendown() {
    turtle.penDown = true;
    turtle.image = turtle.images[1]
    drawIf();
}

// turn right by an angle in degrees
function right(angle) {
    turtle.angle += degToRad(angle);
    drawIf();
}

// turn left by an angle in degrees
function left(angle) {
    turtle.angle -= degToRad(angle);
    drawIf();
}

// move the turtle to a particular coordinate (don't draw on the way there)
function goto(x, y) {
    turtle.pos.x = x;
    turtle.pos.y = y;
    drawIf();
}

// set the angle of the turtle in degrees
function angle(angle) {
    turtle.angle = degToRad(angle);
}

// convert degrees to radians
function degToRad(deg) {
    return deg / 180 * Math.PI;
}

// convert radians to degrees
function radToDeg(rad) {
    return rad * 180 / Math.PI;
}

// set the width of the line
function width(w) {
    turtle.width = w;
    imageContext.lineWidth = w;
}

function roll(angle) {
    turtle.roll -= degToRad(angle);
    drawIf();
}

_peng_saved_image = undefined
function peng() {
    turtle.roll -= degToRad(90);
    _peng_saved_image = turtle.image
    turtle.image = turtle.images[2]
    drawIf();
}

function unpeng() {
    turtle.roll += degToRad(90);
    turtle.image = _peng_saved_image
    drawIf();
}

// write some text at the turtle position.
// ideally we'd like this to rotate the text based on
// the turtle orientation, but this will require some clever
// canvas transformations which aren't implemented yet.
function write(msg) {
    imageContext.save();
    centerCoords(imageContext);
    imageContext.translate(turtle.pos.x, turtle.pos.y);
    imageContext.transform(3, 0, 0, -3, 0, 0);
    imageContext.translate(-turtle.pos.x, -turtle.pos.y);
    imageContext.fillText(msg, turtle.pos.x, turtle.pos.y - 10);
    imageContext.restore();
    drawIf();
}

// set the color of the line using RGB values in the range 0 - 255.
function color(r, g, b, a) {
    turtle.color.r = r;
    turtle.color.g = g;
    turtle.color.b = b;
    turtle.color.a = a;
}

// Generate a random integer between low and hi
function random(low, hi) {
    return Math.floor(Math.random() * (hi - low + 1) + low);
}

function repeat(n, action) {
    for (var count = 1; count <= n; count++)
        action();
}

function animate(f, ms) {
    return setInterval(f, ms);
}

function setFont(font) {
    imageContext.font = font;
}

function change_speed(speed) {
    if (speed == 0) {
        speed = 1
    }
    turtle.speed = speed
}

/////////////////////// new style machine



class Machine {
    constructor() {
        this.reset_machine()
    }
    reset_machine() {
        this.code = []
        this.stack = [
            {
                remaining_time: 0,
                fresh_jump: false,
            }
        ]
        this.ip = -1
    }
    top() {
        return this.stack[this.stack.length - 1]
    }
    ip_valid() {
        return (this.ip >= 0 && this.ip < this.code.length)
    }
    show_program_stopped() {
        reset_highlight_line()
    }
    start_program() {
        if (this.code.length > 0) {
            this.set_ip(0)
            this.jump()
        } else {
            this.reset_machine()
        }
    }
    stop_program() {
        this.reset_machine()
        this.jump()
    }
    on_total_time_delta(total_delta) {
        while (this.ip_valid() && total_delta > 0) {
            var delta = Math.min(this.top().remaining_time, total_delta)
            this.top().remaining_time -= delta
            total_delta -= delta

            this.on_exact_time_delta(delta)
        }
        if (!this.ip_valid()) {
            this.show_program_stopped()
        }
    }
    on_exact_time_delta(delta) {
        var cur = this.code[this.ip]
        if (this.top().fresh_jump) {
            cur.on_enter(this)
            this.top().fresh_jump = false
        }
        cur.on_animate(this, delta)
        if (this.top().remaining_time == 0) {
            this.ip += 1
            cur.on_exit(this)
            this.jump()
        }
    }
    jump() {
        if (this.ip_valid()) {
            var cur = this.code[this.ip]
            this.top().remaining_time = cur.animation_time()
            this.top().fresh_jump = true
        } else {
            this.reset_machine()
        }
    }
}
machine = new Machine()

class Instruction {
    constructor() { }
    on_enter(machine) { }
    on_animate(machine, delta) { }
    on_exit(machine) { }
    animation_time() {
        return 0
    }
}
class EnterInstruction extends Instruction {
    constructor(fn, ...params) {
        this.fn = fn
        this.params = params
    }
    on_enter(machine) {
        (this.fn)(...this.params)
    }
}
class EnterExitInstruction extends Instruction {
    constructor(fn1, fn2) {
        this.fn1 = fn1
        this.fn2 = fn2
    }
    on_enter(machine) {
        (this.fn1)()
    }
    on_exit(machine) {
        (this.fn2)()
    }
}
class AnimateInstruction extends Instruction {
    constructor(fn, param) {
        this.fn = fn
        this.param = param
    }
    on_animate(machine, delta) {
        (this.fn)(this.param * delta)
    }
}



/////////////////////// old style machine

cmd_queue = []
cmd_stack = []

function clear_commands() {
    reset_highlight_line();
    cmd_queue = []
    cmd_stack = []
}

function add_anim_command(line_no, cmd, ...args) {
    cmd_queue.push([1000, line_no, cmd, args, "interpolate"])
}
function add_early_command(line_no, cmd, ...args) {
    cmd_queue.push([1000, line_no, cmd, args, "early"])
}
function add_set_reset_command(line_no, cmd, ...args) {
    cmd_queue.push([1000, line_no, cmd, args, "set_reset"])
}

class CommandParser {
    constructor(re) {
        this.re = re;
    }
    check(line_no, line, indent) {
        var chk = this.re.exec(line)
        if (chk) {
            var args = chk.slice(1)
            this.exec(line_no, ...args)
            return true;
        }
        return false;
    }
    exec(line_no, ...args) {
        //console.log(args)
        this.fn(line_no, ...args)
    }
    with(fn) {
        this.fn = fn
        return this
    }

    anim_with(fn) {
        return this.with((line_no, ...args) => {
            add_anim_command(line_no, ...fn(...args))
        })
    }
    early_with(fn) {
        return this.with((line_no, ...args) => {
            add_early_command(line_no, ...fn(...args))
        })
    }
    set_reset_with(fn) {
        return this.with((line_no, ...args) => {
            add_set_reset_command(line_no, ...fn(...args))
        })
    }

    anim(...args) {
        return this.with((line_no) => {
            add_anim_command(line_no, ...args)
        })
    }
    early(...args) {
        return this.with((line_no) => {
            add_early_command(line_no, ...args)
        })
    }
    set_reset(...args) {
        return this.with((line_no) => {
            add_set_reset_command(line_no, ...args)
        })
    }
}


// Implementation of all commands
const command_parsers = [
    new CommandParser(/bark/).early(write, "bork!"),
    new CommandParser(/hide/).anim(hideTurtle, 100),
    new CommandParser(/show/).anim(showTurtle, 100),
    new CommandParser(/hold pen down/).early(pendown),
    new CommandParser(/pick pen up/).early(penup),
    new CommandParser(/peng/).set_reset(peng, unpeng),
    new CommandParser(/roll over/).anim(roll, 360),

    new CommandParser(/run (\d+) pixel forward/).anim_with((arg) => [forward, parseFloat(arg)]),
    new CommandParser(/turn (\d+) degree left/).anim_with((arg) => [left, parseFloat(arg)]),
    new CommandParser(/turn (\d+) degree right/).anim_with((arg) => [right, parseFloat(arg)]),

    new CommandParser(/change pen width to (\d+) pixel/).early_with((arg) => [width, parseFloat(arg)]),
    new CommandParser(/change pen color to (\d+) (\d+) (\d+)/).early_with((r, g, b) => [color, parseInt(r), parseInt(g), parseInt(b), 255]),
    new CommandParser(/change speed to (\d+)/).early_with((arg) => [change_speed, parseFloat(arg)]),

    new CommandParser(/repeat this sublist (\d+) times:/).with((line_no, arg) => {
        var next_idx = cmd_queue.length

    }),
];

function tem_parse(words, line_no, indent) {
    console.log("indent: " + indent)

    var line = words.join(" ")

    try {
        var executed = false;
        command_parsers.forEach(command => {
            executed |= command.check(line_no, line, indent)
        });
        if (!executed) {
            throw "unknown command"
        }
    } catch (e) {
        throw {
            message: "I don't understand that!",
            nerd_reason: e,
        }
    }
}


anim_cmd_pointer = -1
anim_timeout = 0
function jump(idx) {
    if (idx >= 0 && idx < cmd_queue.length) {
        anim_cmd_pointer = idx
        anim_timeout = cmd_queue[anim_cmd_pointer][0]
    } else {
        anim_cmd_pointer = -1
        anim_timeout = 0
    }
}
function jump_next() {
    if (anim_cmd_pointer >= 0) {
        jump(anim_cmd_pointer + 1)
    } else {
        jump(-1)
    }
}
function current_cmd() {
    if (anim_cmd_pointer >= 0) {
        return cmd_queue[anim_cmd_pointer].slice(1)
    } else {
        return undefined
    }
}
function stop_animate() {
    jump(-1)
}
function noop() { }
function start_animate() {
    jump(0)
}

last_time = Date.now()
function on_frame() {
    var this_time = Date.now()
    var delta = (this_time - last_time)
    last_time = this_time
    if (anim_cmd_pointer >= 0) {
        // decrease timeout till first command runs...
        var weighted_delta = (delta * turtle.speed) / 1000

        var [cmd_line_no, cmd_fn, cmd_fn_args, cmd_animation_kind] = current_cmd();

        if (anim_timeout === 1000) {
            // highlight command
            highlight_line(cmd_line_no)

            if (cmd_animation_kind == "early") {
                cmd_fn(...cmd_fn_args);
            } else if (cmd_animation_kind == "set_reset") {
                cmd_fn();
            }
        }

        anim_timeout -= weighted_delta * 1000

        if (anim_timeout <= 0) {
            // backcompensate delta
            var overshoot_weighted_delta = (-anim_timeout) / 1000
            weighted_delta -= overshoot_weighted_delta
        }

        if (cmd_animation_kind == "interpolate") {
            var step_arg = cmd_fn_args[0] * weighted_delta
            cmd_fn(step_arg);
        } else if (anim_timeout <= 0) {
            if (cmd_animation_kind == "late") {
                cmd_fn(...cmd_fn_args);
            } else if (cmd_animation_kind == "set_reset") {
                cmd_fn_args[0]();
            }
        }

        if (anim_timeout <= 0) {
            // increment instruction counter (can still change by command)
            jump_next();
        }
    } else {
        reset_highlight_line()
    }

    requestAnimationFrame(on_frame);
}

//////////////////
// UI code below//
//////////////////

// Navigate command history
var commandList = [];
var currentCommand = 0;

re_leading_ws = /\S|$/

function run_tem_code(line, line_no) {
    indent = line.search(re_leading_ws)
    var split_command = line.split(" ").filter(function (el) {
        return el != "";
    });
    if (split_command.length != 0) {
        tem_parse(split_command, line_no, indent)
    } else {
        // TODO: no command handler
    }
}

function enqueue_commands(definitionsText) {
    var l = 0;
    var err_lines = []

    reset();
    clear_commands();
    definitionsText.split(/[\r\n]/g).forEach(element => {
        try {
            run_tem_code(element, l)
        } catch (e) {
            console.log(e.nerd_reason)
            err_lines.push(l)
        } finally { l += 1; }
    });
    return { trimmed_text: definitionsText.trimRight(), err_lines: err_lines }
}

$('#resetButton').click(function () {
    reset();
    clear_commands();
    stop_animate();
});

$('#replayButton').click(function () {
    rerun_editor();
});

$('#exampleButton').click(function () {
    editor.getSession().setValue(
        `turn 20 degree right

hold pen down

run 100 pixel forward
turn 90 degree left

bark

run 100 pixel forward
turn 90 degree left

roll over

run 100 pixel forward
turn 90 degree left

peng

run 100 pixel forward
turn 45 degree left

pick pen up

run 50 pixel forward

hide
`
    );
});

var Range = ace.require('ace/range').Range;
_markers = []

function rerun_editor() {
    stop_animate();
    var ctx = enqueue_commands(editor.getSession().getValue());
    start_animate();

    _markers.forEach(element => {
        editor.session.removeMarker(element);
    });
    _markers = []
    ctx.err_lines.forEach(element => {
        var from = element
        var to = element
        var marker_id = editor.session.addMarker(new Range(from, 0, to, 1), "myMarker", "fullLine");
        _markers.push(marker_id);
    });
}

_current_line_marker = []
function reset_highlight_line() {
    _current_line_marker.forEach(element => {
        editor.session.removeMarker(element);
    });
    _current_line_marker = []
}
function highlight_line(element) {
    reset_highlight_line();
    if (element != -1) {
        var from = element
        var to = element
        var marker_id = editor.session.addMarker(new Range(from, 0, to, 1), "myMarker2", "fullLine");
        _current_line_marker.push(marker_id);
    }
}

function update_code_link(code) {
    var encoded = LZString.compressToBase64(code)
    //console.log(encoded)
    //console.log(window.location.href)

    //document.location.search = "code=" + encoded

    var url = new URL(window.location.href);
    var params = new URLSearchParams(url.search);
    params.set("code", encoded)
    url.search = params

    $('#share_link').val(url)
}

{
    var coll = document.getElementsByClassName("collapsible");
    var i;
    for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function () {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    }
}


{
    var copyEmailBtn = document.querySelector('.js-emailcopybtn');
    copyEmailBtn.addEventListener('click', function (event) {
        var share_link = $('#share_link').val()
        navigator.clipboard.writeText(share_link).then(function () {
            // Promise resolved successfully.
            console.log("Copied to clipboard successfully!");
        }, function () {
            // Promise rejected.
            console.error("Unable to write to clipboard. :-(");
        });
    });
}

editor = undefined
$('#definitions').each(function () {
    var textarea = $(this);
    var mode = textarea.data('editor');
    var editDiv = $('<div>', {
        position: 'absolute',
        width: textarea.width(),
        height: textarea.height(),
        'class': textarea.attr('class')
    }).insertBefore(textarea);
    textarea.css('display', 'none');
    editor = ace.edit(editDiv[0]);
    //editor.renderer.setShowGutter(textarea.data('gutter'));
    editor.renderer.setShowGutter(true);

    editor.setTheme("ace/theme/solarized_light");

    var is_self_editing = false;
    editor.getSession().on('change', function (e) {
        if (!is_self_editing) {
            rerun_editor();
            var existing_val = editor.getSession().getValue();
            textarea.val(existing_val);
            update_code_link(existing_val)
        }
    });
});

loadImages(["temmie_normal.png", "temmie_pen.png", "temmie_peng.png"]).then(images => {
    image_cache = images
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code')) {
        var encoded = urlParams.get('code')
        var decoded = LZString.decompressFromBase64(encoded)
        editor.getSession().setValue(decoded);
    } else {
        $('#definitions').each(function () {
            var textarea = $(this);
            editor.getSession().setValue(textarea.val());
        });
    }
    reset();
})
on_frame();

