// Copyright (C) 2022 Lains

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

const Main = imports.ui.main;
const SessionMode = imports.ui.sessionMode;
const { Gio, GLib, Meta, St, GObject, Shell, Atk, Clutter } = imports.gi;
const PanelMenu = imports.ui.panelMenu;
const { AppMenu } = imports.ui.appMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Overview = imports.ui.overview;
const extension = ExtensionUtils.getCurrentExtension();
const OverviewControls = imports.ui.overviewControls;

const CLOCK_CENTER = 0;
const CLOCK_RIGHT = 2;

let indicatorPad = null;
let handleBanner = false;
function clock_alignment(alignment) {
  // Clock Alignment breaks Date Menu, when other extensions like Dash-to-Panel are used
  let dash2Panel = Main.extensionManager.lookup(
    "dash-to-panel@jderose9.github.com"
  );
  if (dash2Panel && dash2Panel.state == ExtensionUtils.ExtensionState.ENABLED) {
    return;
  }

  // Notification manager handles banner, these two should not conflict
  let notifManager = Main.extensionManager.lookup(
    "notification-manager@tauos.co"
  );
  if (
    !notifManager ||
    !notifManager.state == ExtensionUtils.ExtensionState.ENABLED
  ) {
    handleBanner = true;
  }

  if (Main.layoutManager.monitors.length == 0) {
    return;
  }

  const dateMenu = Main.panel.statusArea["dateMenu"];
  const container = dateMenu.container;
  const parent = container.get_parent();
  if (parent != null) {
    parent.remove_child(container);
  }

  const banner_width = Main.panel.statusArea.dateMenu._messageList.width;
  const banner_offset = Main.layoutManager.monitors[0].width - banner_width;
  let clock_padding = false;
  handleBanner ? (Main.messageTray._bannerBin.width = banner_width) : null;
  if (alignment == CLOCK_RIGHT) {
    children = Main.panel._rightBox.get_children();
    Main.panel._rightBox.insert_child_at_index(
      dateMenu.container,
      children.length - 1
    );
    handleBanner
      ? (Main.messageTray._bannerBin.x = banner_offset * 0.95)
      : null;
    clock_padding = false;
  } else {
    Main.panel._centerBox.add_actor(container);
    handleBanner ? (Main.messageTray._bannerBin.x = 0) : null;
    clock_padding = true;
  }
}

var ActivitiesButton = GObject.registerClass(
  class ActivitiesButton extends PanelMenu.Button {
    _init() {
      super._init(0.0, null, true);
      this.container.name = "panelActivitiesIconButtonContainer";
      this.accessible_role = Atk.Role.TOGGLE_BUTTON;
      this.name = "panelActivitiesIconButton";
      this._labelBox = new St.BoxLayout({ style_class: "space" });
      this._textBin = new St.Bin();
      this._label = new St.Label({
        text: "",
        y_align: Clutter.ActorAlign.CENTER,
      });
      this._textBin.child = this._label;
      this._labelBox.add(this._textBin);
      this.add_actor(this._labelBox);
      this.label_actor = this._label;

      this._overviewShowingSig = 0;
      this._overviewHidingSig = 0;

      this._overviewShowingSig = Main.overview.connect("showing", () => {
        this.add_style_pseudo_class("overview");
        this.add_accessible_state(Atk.StateType.CHECKED);
      });
      this._overviewHidingSig = Main.overview.connect("hiding", () => {
        this.remove_style_pseudo_class("overview");
        this.remove_accessible_state(Atk.StateType.CHECKED);
      });
    }

    set label(labelText) {
      this._label.set_text(labelText);
    }

    get label() {
      return this._label.get_text();
    }

    vfunc_event(event) {
      if (
        event.type() == Clutter.EventType.TOUCH_END ||
        event.type() == Clutter.EventType.BUTTON_RELEASE
      ) {
        if (Main.overview.shouldToggleByCornerOrButton())
          Main.overview.toggle();
      }
      return Clutter.EVENT_PROPAGATE;
    }

    vfunc_key_release_event(keyEvent) {
      let symbol = keyEvent.keyval;
      if (symbol == Clutter.KEY_Return || symbol == Clutter.KEY_space) {
        if (Main.overview.shouldToggleByCornerOrButton()) {
          Main.overview.toggle();
          return Clutter.EVENT_STOP;
        }
      }

      return Clutter.EVENT_PROPAGATE;
    }
  }
);

class TopBar {
  constructor() {}

  _setLabel() {
    let labelText = "Workspaces";

    if (!labelText) {
      this._activitiesButton._textBin.hide();
      this._activitiesButton.hide();
    } else {
      this._activitiesButton.label = labelText;
      this._activitiesButton._textBin.show();
      this._activitiesButton.show();
    }
  }

  enable() {
    Main.panel.statusArea.activities.container.hide();
    this._activitiesButton = new ActivitiesButton();
    this._setLabel();
    Main.panel.addToStatusArea(
      "activities-icon-button",
      this._activitiesButton,
      0,
      "left"
    );

    // do nothing if the clock isn't centered in this mode
    if (Main.sessionMode.panel.center.indexOf("dateMenu") == -1) {
      return;
    }

    let centerBox = Main.panel._centerBox;
    let dateMenu = Main.panel.statusArea["dateMenu"];
    let appMenu = Main.panel.statusArea["appMenu"];
    let children = centerBox.get_children();

    // only move the clock if it's in the center box
    if (children.indexOf(dateMenu.container) != -1) {
      clock_alignment(CLOCK_RIGHT);
    }

    Main.layoutManager.panelBox.add_effect(
      new Shell.BlurEffect({
        brightness: 0.95,
        sigma: 5,
        mode: 1,
      })
    );
  }

  disable() {
    this._activitiesButton.destroy();
    this._activitiesButton = null;
    if (Main.sessionMode.currentMode == "unlock-dialog") {
      Main.panel.statusArea.activities.container.hide();
    } else {
      Main.panel.statusArea.activities.container.show();
    }

    // do nothing if the clock isn't centered in this mode
    if (Main.sessionMode.panel.center.indexOf("dateMenu") == -1) {
      return;
    }

    let rightBox = Main.panel._rightBox;
    let dateMenu = Main.panel.statusArea["dateMenu"];
    let appMenu = Main.panel.statusArea["appMenu"];
    let children = rightBox.get_children();

    // only move the clock back if it's in the right box
    if (children.indexOf(dateMenu.container) != -1) {
      clock_alignment(CLOCK_CENTER);
    }
  }
}

function init() {
  return new TopBar();
}
