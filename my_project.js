"use strict"

import b4w from "blend4web";

// import modules used by the app
var m_app       = b4w.app;
var m_cfg       = b4w.config;
var m_data      = b4w.data;
var m_preloader = b4w.preloader;
var m_ver       = b4w.version;
var m_anim      = b4w.animation;
var m_scenes    = b4w.scenes;
var m_cam = b4w.camera;
var m_physics = b4w.physics;
var m_constraints = b4w.constraints;
var m_ctl = b4w.controls;

var CAMERA_OFFSET = new Float32Array([0, 20, 20]);

var _character = null;
var _character_rig = null;

// detect application mode
var DEBUG = (m_ver.type() == "DEBUG");

// automatically detect assets path
var APP_ASSETS_PATH = m_cfg.get_assets_path();

/**
 * export the method to initialize the app (called at the bottom of this file)
 */
function init() {
    m_app.init({
        canvas_container_id: "main_canvas_container",
        callback: init_cb,
        show_fps: DEBUG,
        console_verbose: DEBUG,
        autoresize: true,
        physics_uranium_path: '/node_modules/blend4web/dist/uranium/'
    });
}

/**
 * callback executed when the app is initialized 
 */
function init_cb(canvas_elem, success) {

    if (!success) {
        console.log("b4w init failure");
        return;
    }

    m_preloader.create_preloader();

    // ignore right-click on the canvas element
    canvas_elem.oncontextmenu = function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    load();
}

/**
 * load the scene data
 */
function load() {
    m_data.load(APP_ASSETS_PATH + "animations.json", load_cb, preloader_cb);
}

/**
 * update the app's preloader
 */
function preloader_cb(percentage) {
    m_preloader.update_preloader(percentage);
}

/**
 * callback executed when the scene data is loaded
 */
function load_cb(data_id, success) {

    if (!success) {
        console.log("b4w load failure");
        return;
    }

    //m_app.enable_camera_controls();

    _character = m_scenes.get_first_character();
    let camera = m_scenes.get_active_camera();
    _character_rig = m_scenes.get_object_by_name('Character');

    m_constraints.append_semi_soft(camera, _character, CAMERA_OFFSET);

    m_anim.stop(_character_rig);
    m_anim.apply(_character_rig, 'Run');
    m_anim.set_behavior(_character_rig, m_anim.AB_CYCLIC, m_anim.SLOT_0);
    m_anim.set_behavior(_character_rig, m_anim.AB_CYCLIC, m_anim.SLOT_1);
    m_anim.play(_character_rig, undefined, m_anim.SLOT_0);

    init_movement();

    init_animation();
}

function init_movement() {
    let key_w = m_ctl.create_keyboard_sensor(m_ctl.KEY_W);
    let key_s = m_ctl.create_keyboard_sensor(m_ctl.KEY_S);
    let key_up = m_ctl.create_keyboard_sensor(m_ctl.KEY_UP);
    let key_down = m_ctl.create_keyboard_sensor(m_ctl.KEY_DOWN);

    let move_array = [
        key_w, key_up,
        key_s, key_down
    ];

    let forward_logic = function(s){return (s[0] || s[1])};
    let backward_logic = function(s){return (s[2] || s[3])};

    function move_cb(obj, id, pulse) {
        if (pulse == 1) {
            switch(id) {
                case "FORWARD":
                    var move_dir = 1;
                    m_anim.apply(_character_rig, 'Run');
                    break;
                case "BACKWARD":
                    var move_dir = -1;
                    m_anim.apply(_character_rig, "Run");
                    break;
            }
        } else {
            var move_dir = 0;
            m_anim.apply(_character_rig, 'Idle');
        }

        m_physics.set_character_move_dir(obj, move_dir, 0);
        m_anim.play(_character_rig);
        m_anim.set_behavior(_character_rig, m_anim.AB_CYCLIC);
    }

    m_ctl.create_sensor_manifold(_character, "FORWARD", m_ctl.CT_TRIGGER,
        move_array, forward_logic, move_cb);
    m_ctl.create_sensor_manifold(_character, "BACKWARD", m_ctl.CT_TRIGGER,
        move_array, backward_logic, move_cb);
}

function init_animation() {
    
    
    let animation_toggler = false;

    document.addEventListener('keydown', function(e) {
        if (e.keyCode === 32) {
            m_physics.character_jump(_character);
        }
    });

    function toggle_animation() {
        m_anim.stop(_character_rig);
        if (animation_toggler === false) {
            m_anim.apply(_character_rig, 'Run');
        } else {
            m_anim.apply(_character_rig, 'Idle');
        }
        m_anim.set_behavior(_character_rig, m_anim.AB_CYCLIC);
        m_anim.play(_character_rig);

        animation_toggler = !animation_toggler;
    }
    
    document.addEventListener('click', function() {
        m_anim.stop(_character_rig);
        if (animation_toggler === false) {
            m_anim.apply(_character_rig, 'Run');
        } else {
            m_anim.apply(_character_rig, 'Idle');
        }
        m_anim.set_behavior(_character_rig, m_anim.AB_CYCLIC);
        m_anim.play(_character_rig);

        animation_toggler = !animation_toggler;
    });
}

init();
