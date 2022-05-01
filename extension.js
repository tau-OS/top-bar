// Copyright (C) 2022 Lains
// License: GPLv3+

const Main = imports.ui.main;
const SessionMode = imports.ui.sessionMode;

const CLOCK_CENTER = 0;
const CLOCK_RIGHT = 2;

let indicatorPad = null;
function clock_alignment(alignment) {
    // Clock Alignment breaks Date Menu, when other extensions like Dash-to-Panel are used
    let dash2Panel = Main.extensionManager.lookup("dash-to-panel@jderose9.github.com");
    if(dash2Panel && dash2Panel.state == ExtensionUtils.ExtensionState.ENABLED){
        return;
    }

    if (Main.layoutManager.monitors.length == 0) {
        return;
    }

    const dateMenu = Main.panel.statusArea['dateMenu'];
    const container = dateMenu.container;
    const parent = container.get_parent();
    if (parent != null) {
        parent.remove_child (container);
    }

    const banner_width = Main.panel.statusArea.dateMenu._messageList.width;
    const banner_offset = Main.layoutManager.monitors[0].width - banner_width;
    let clock_padding = false;
    Main.messageTray._bannerBin.width = banner_width;
    if (alignment == CLOCK_RIGHT) {
        Main.panel._rightBox.add_actor(container);
        Main.messageTray._bannerBin.x = banner_offset*(0.88);
    } else {
        Main.panel._centerBox.add_actor(container);
        Main.messageTray._bannerBin.x = 0;
        clock_padding = true;
    }

    const dateMenuBox = dateMenu.get_child_at_index(0);
    if (indicatorPad == null) {
        indicatorPad = dateMenuBox.get_child_at_index(0);
    }
    if (clock_padding) {
        if (indicatorPad.get_parent() == null) {
            dateMenuBox.insert_child_at_index(indicatorPad, 0);
        }
    } else {
        if (indicatorPad.get_parent() != null) {
            dateMenuBox.remove_child(indicatorPad);
        }
    }
}

function init() {
}

function enable() {
    // do nothing if the clock isn't centered in this mode
    if ( Main.sessionMode.panel.center.indexOf('dateMenu') == -1 ) {
        return;
    }

    let centerBox = Main.panel._centerBox;
    let rightBox = Main.panel._rightBox;
    let panel = Main.panel;
    let dateMenu = Main.panel.statusArea['dateMenu'];
    let appMenu = Main.panel.statusArea['appMenu'];
    let children = centerBox.get_children();
    
    appMenu.container.hide();

    // only move the clock if it's in the center box
    if ( children.indexOf(dateMenu.container) != -1 ) {
        clock_alignment(CLOCK_RIGHT);
    }
}

function disable() {
    // do nothing if the clock isn't centered in this mode
    if ( Main.sessionMode.panel.center.indexOf('dateMenu') == -1 ) {
        return;
    }

    let centerBox = Main.panel._centerBox;
    let rightBox = Main.panel._rightBox;
    let panel = Main.panel;
    let dateMenu = Main.panel.statusArea['dateMenu'];
    let appMenu = Main.panel.statusArea['appMenu'];
    let children = rightBox.get_children();
    
    appMenu.container.show();

    // only move the clock back if it's in the right box
    if ( children.indexOf(dateMenu.container) != -1 ) {
        clock_alignment(CLOCK_CENTER);
    }
}
