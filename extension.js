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
const ExtensionUtils = imports.misc.extensionUtils;
const Overview = imports.ui.overview;

const CLOCK_CENTER = 0;
const CLOCK_RIGHT = 2;

let injections = [];

function inject(object, parameter, replacement) {
    injections.push({
        "object": object,
        "parameter": parameter,
        "value": object[parameter]
    });
    object[parameter] = replacement;
}

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
      ? (Main.messageTray._bannerBin.x = banner_offset * 0.88)
      : null;
    clock_padding = false;
  } else {
    Main.panel._centerBox.add_actor(container);
    handleBanner ? (Main.messageTray._bannerBin.x = 0) : null;
    clock_padding = true;
  }
}

function init() {
  this._actorSignalIds = null;
  this._windowSignalIds = null;
}

var ActivitiesIconButton = GObject.registerClass(
class ActivitiesIconButton extends PanelMenu.Button {
    _init() {
        super._init(0.0, null, true);
        this.container.name = 'panelActivitiesIconButtonContainer';
        this.accessible_role = Atk.Role.TOGGLE_BUTTON;
        this.name = 'panelActivitiesIconButton';
        this._iconLabelBox = new St.BoxLayout({style_class: 'space'});
        this._iconBin = new St.Bin();
        this._textBin = new St.Bin();
        this._iconLabelBox.add(this._iconBin);
        this._label = new St.Label({ text: "", y_align:Clutter.ActorAlign.CENTER });
        this._textBin.child = this._label;
        this._iconLabelBox.add(this._textBin);
        this.add_actor(this._iconLabelBox);
        this.label_actor = this._label;
        
        this._overviewShowingSig = 0;
        this._overviewHidingSig = 0;

        this._overviewShowingSig = Main.overview.connect('showing', () => {
            this.add_style_pseudo_class('overview');
            this.add_accessible_state(Atk.StateType.CHECKED);
        });
        this._overviewHidingSig = Main.overview.connect('hiding', () => {
            this.remove_style_pseudo_class('overview');
            this.remove_accessible_state(Atk.StateType.CHECKED);
        });
    }

    set label(labelText) {
        this._label.set_text(labelText);
    }

    get label() {
        return (this._label.get_text());
    }
    
    vfunc_captured_event(event) {
        if (event.type() == Clutter.EventType.BUTTON_PRESS ||
            event.type() == Clutter.EventType.TOUCH_BEGIN) {
            if (!Main.overview.shouldToggleByCornerOrButton())
                return Clutter.EVENT_STOP;
        }
        return Clutter.EVENT_PROPAGATE;
    }

    vfunc_event(event) {
        if (event.type() == Clutter.EventType.TOUCH_END ||
            event.type() == Clutter.EventType.BUTTON_RELEASE) {
            if (Main.overview.shouldToggleByCornerOrButton())
                this.toggle();
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
});

function _setLabel() {
    this._activitiesIconButton._iconBin.hide();
    this._activitiesIconButton.label = "Workspaces";
    this._activitiesIconButton._textBin.show();
    this._activitiesIconButton.show();
}

function enable() {
    Main.panel.statusArea.activities.container.hide();
    this._activitiesIconButton = new ActivitiesIconButton();
    this._setLabel();
    Main.panel.addToStatusArea('activities-icon-button', this._activitiesIconButton, 0, 'left');
  
    const overview_show = Main.overview.show;
    inject(Main.overview, 'show', function() {
        overview_show.call(this);
        applications.hide();
    });

    const overview_hide = Main.overview.hide;
    inject(Main.overview, 'hide', function() {
        overview_hide.call(this);
        applications.hide();
    });

    // Catalogue details
    inject(AppMenu.prototype, "_updateDetailsVisibility", function () {
        this._detailsItem.visible = false;

        const sw = this._appSystem.lookup_app('co.tauos.catalogue.desktop');
        if (sw !== null) {
            this._detailsItem = this.addAction(_('Show Details'), async () => {
                const id = this._app.get_id();
                Util.trySpawn(["co.tauos.catalogue", "appstream://" + id]);
                Main.overview.hide();
            });
        }
    });
    
    Main.overview.searchEntry.hide();

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

  this._actorSignalIds = new Map();
  this._windowSignalIds = new Map();

  this._actorSignalIds.set(Main.overview, [
    Main.overview.connect("showing", this._updateTransparent.bind(this)),
    Main.overview.connect("hiding", this._updateTransparent.bind(this)),
  ]);

  this._actorSignalIds.set(Main.sessionMode, [
    Main.sessionMode.connect("updated", this._updateTransparent.bind(this)),
  ]);

  for (const metaWindowActor of global.get_window_actors()) {
    this._onWindowActorAdded(metaWindowActor.get_parent(), metaWindowActor);
  }

  this._actorSignalIds.set(global.window_group, [
    global.window_group.connect(
      "actor-added",
      this._onWindowActorAdded.bind(this)
    ),
    global.window_group.connect(
      "actor-removed",
      this._onWindowActorRemoved.bind(this)
    ),
  ]);

  this._actorSignalIds.set(global.window_manager, [
    global.window_manager.connect(
      "switch-workspace",
      this._updateTransparent.bind(this)
    ),
  ]);

  this._updateTransparent();

  const SHELL_THEME_SCHEMA = "org.gnome.shell.extensions.user-theme";
  let settings = new Gio.Settings({ schema_id: SHELL_THEME_SCHEMA });
  settings.connect("changed::name", () => {
    this._updateTransparent();
  });
}

function disable() {
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

  for (const actorSignalIds of [this._actorSignalIds, this._windowSignalIds]) {
    for (const [actor, signalIds] of actorSignalIds) {
      for (const signalId of signalIds) {
        actor.disconnect(signalId);
      }
    }
  }
  this._actorSignalIds = null;
  this._windowSignalIds = null;
  
  this._activitiesIconButton.destroy();
  this._activitiesIconButton = null;
  if (Main.sessionMode.currentMode == 'unlock-dialog') {
    Main.panel.statusArea.activities.container.hide();
  } else {
    Main.panel.statusArea.activities.container.show();
  }

  Main.panel.remove_style_class_name("top-bar--solid");
  Main.panel.remove_style_class_name("top-bar--transparent-light");
  Main.panel.remove_style_class_name("top-bar--transparent-dark");
  
  Main.overview.searchEntry.show();
  
    let i;
    for(i in injections) {
       let injection = injections[i];
       injection["object"][injection["parameter"]] = injection["value"];
    }
}

function _onWindowActorAdded(container, metaWindowActor) {
  this._windowSignalIds.set(metaWindowActor, [
    metaWindowActor.connect(
      "notify::allocation",
      this._updateTransparent.bind(this)
    ),
    metaWindowActor.connect(
      "notify::visible",
      this._updateTransparent.bind(this)
    ),
  ]);
}

function _onWindowActorRemoved(container, metaWindowActor) {
  for (const signalId of this._windowSignalIds.get(metaWindowActor)) {
    metaWindowActor.disconnect(signalId);
  }
  this._windowSignalIds.delete(metaWindowActor);
  this._updateTransparent();
}

function _updateTransparent() {
  if (
    Main.panel.has_style_pseudo_class("overview") ||
    !Main.sessionMode.hasWindows
  ) {
    this._setTransparent(true);
    return;
  }

  if (!Main.layoutManager.primaryMonitor) {
    return;
  }

  // Get all the windows in the active workspace that are in the primary monitor and visible.
  const workspaceManager = global.workspace_manager;
  const activeWorkspace = workspaceManager.get_active_workspace();
  const windows = activeWorkspace.list_windows().filter((metaWindow) => {
    return (
      metaWindow.is_on_primary_monitor() &&
      metaWindow.showing_on_its_workspace() &&
      !metaWindow.is_hidden() &&
      metaWindow.get_window_type() !== Meta.WindowType.DESKTOP
    );
  });

  // Check if at least one window is near enough to the panel.
  const panelTop = Main.panel.get_transformed_position()[1];
  const panelBottom = panelTop + Main.panel.get_height();
  const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
  const isNearEnough = windows.some((metaWindow) => {
    const verticalPosition = metaWindow.get_frame_rect().y;
    return verticalPosition < panelBottom + 5 * scale;
  });

  this._setTransparent(isNearEnough);
}

function _setTransparent(transparent) {
  const SHELL_THEME_SCHEMA = "org.gnome.shell.extensions.user-theme";
  let settings = new Gio.Settings({ schema_id: SHELL_THEME_SCHEMA });

  if (GLib.str_has_suffix(settings.get_string("name"), "-dark")) {
    if (transparent) {
      Main.panel.remove_style_class_name("top-bar--normal");
      Main.panel.remove_style_class_name("top-bar--solid-light");
      Main.panel.add_style_class_name("top-bar--solid-dark");
    } else {
      Main.panel.add_style_class_name("top-bar--normal");
      Main.panel.remove_style_class_name("top-bar--solid-light");
      Main.panel.remove_style_class_name("top-bar--solid-dark");
    }
  } else {
    if (transparent) {
      Main.panel.remove_style_class_name("top-bar--normal");
      Main.panel.add_style_class_name("top-bar--solid-light");
      Main.panel.remove_style_class_name("top-bar--solid-dark");
    } else {
      Main.panel.add_style_class_name("top-bar--normal");
      Main.panel.remove_style_class_name("top-bar--solid-light");
      Main.panel.remove_style_class_name("top-bar--solid-dark");
    }
  }
}
