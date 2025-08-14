import { ILayoutRestorer, JupyterFrontEnd, JupyterFrontEndPlugin } from "@jupyterlab/application";
import { ICommandPalette, MainAreaWidget, WidgetTracker } from "@jupyterlab/apputils";
import { IMainMenu } from '@jupyterlab/mainmenu';
import { INotebookTree } from "@jupyter-notebook/tree";
import { Menu } from '@lumino/widgets';

import { HistoryWidget } from "./history";

/**
 * The plugin IDs
 */
const pluginIDs = {
  menus: '@jupyter/nbexchange:menu',
  history: '@jupyter/nbexchange:history',
}

/**
 * The command IDs
 */
export const commandIDs = {
  openAssignmentsList: 'nbgrader:open-assignment-list',
  openCoursesList: 'nbgrader:open-course-list',
  openFormgrader: 'nbgrader:open-formgrader',
  openFormgraderLocal: 'nbgrader:open-formgrader-local',
  openCreateAssignment: 'nbgrader:open-create-assignment',
  openHistory: 'nbexchange:open-history'
}

/**
 * Initialization data for the nbexchange-jlab extension.
 */
const menuExtension: JupyterFrontEndPlugin<void> = {
  id: pluginIDs.menus,
  description: 'Add NbExchange main menu',
  autoStart: true,
  requires: [IMainMenu],
  optional: [ICommandPalette],
  activate: (app: JupyterFrontEnd,
             mainMenu: IMainMenu,
             palette: ICommandPalette | null) => {

    const nbgraderMenu = new Menu({ commands: app.commands });
    nbgraderMenu.id = 'jp-mainmenu-nbgrader';
    nbgraderMenu.title.label = 'Nbgrader';

    if (palette) {
      palette.addItem({
        command: commandIDs.openHistory,
        category: 'nbgrader'
      });
    }

    nbgraderMenu.addItem({ command: commandIDs.openAssignmentsList });
    nbgraderMenu.addItem({ command: commandIDs.openCoursesList });
    nbgraderMenu.addItem({ command: commandIDs.openFormgrader });
    nbgraderMenu.addItem({ command: commandIDs.openFormgraderLocal });
    nbgraderMenu.addItem({ command: commandIDs.openHistory });

    mainMenu.addMenu(nbgraderMenu);

    console.log('JupyterLab extension {} is activated!', pluginIDs.menus);
  }
};

/**
 * Assignment list plugin.
 */
const historyListExtension: JupyterFrontEndPlugin<void> = {
  id: pluginIDs.history,
  autoStart: true,
  optional: [ILayoutRestorer, INotebookTree],
  activate: (
      app: JupyterFrontEnd,
      restorer: ILayoutRestorer | null,
      notebookTree: INotebookTree | null
  ) => {
    // Declare a widget variable
    let widget: MainAreaWidget<HistoryWidget>;

    // Track the widget state
    let tracker = new WidgetTracker<MainAreaWidget<HistoryWidget>>({
      namespace: 'nbexchange-history'
    });

    app.commands.addCommand(commandIDs.openHistory, {
      label: 'History',
      execute: () => {
        if(!widget || widget.isDisposed){
          const content = new HistoryWidget(app);
          widget = new MainAreaWidget({content});
          widget.id = 'nbexchange-history';
          widget.addClass('nbgrader-mainarea-widget');
          widget.title.label = 'History';
          widget.title.closable = true;
        }
        if(!tracker.has(widget)){
          // Track the state of the widget for later restoration
          tracker.add(widget);
        }

        // Attach the widget to the main area if it's not there
        if(!widget.isAttached){
          if (notebookTree){
            notebookTree.addWidget(widget);
            notebookTree.currentWidget = widget;
          }
          else app.shell.add(widget, 'main');
        }

        widget.content.update();

        app.shell.activateById(widget.id);
      }
    });

    // Restore the widget state
    if (restorer != null) {
      restorer.restore(tracker, {
        command: commandIDs.openHistory,
        name: () => 'nbexchange-history'
      });
    }

    console.log('JupyterLab extension {} is activated!', pluginIDs.history);
  }
};

export default [
  menuExtension,
  historyListExtension
]
