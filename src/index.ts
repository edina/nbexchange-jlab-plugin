import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  ICommandPalette,
  MainAreaWidget,
  WidgetTracker
} from '@jupyterlab/apputils';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { INotebookTree } from '@jupyter-notebook/tree';
import { Menu } from '@lumino/widgets';

import { HistoryWidget } from './history';
import { BulkAutogradeWidget } from './bulkAutograde';

/**
 * The plugin IDs
 */
const pluginIDs = {
  menus: '@jupyter/nbexchange:menu',
  history: '@jupyter/nbexchange:history',
  bulkAutograde: '@jupyter/nbexchange:bulkAutograde'
};

/**
 * The command IDs
 */
export const commandIDs = {
  openAssignmentsList: 'nbgrader:open-assignment-list',
  openCoursesList: 'nbgrader:open-course-list',
  openFormgrader: 'nbgrader:open-formgrader',
  openFormgraderLocal: 'nbgrader:open-formgrader-local',
  openCreateAssignment: 'nbgrader:open-create-assignment',
  openHistory: 'nbexchange:open-history',
  openBulkAutograde: 'nbexchange:open-bulk-autograde'
};

/**
 * Initialization data for the nbexchange-jlab extension.
 */
const menuExtension: JupyterFrontEndPlugin<void> = {
  id: pluginIDs.menus,
  description: 'Add NbExchange main menu',
  autoStart: true,
  requires: [IMainMenu],
  optional: [ICommandPalette],
  activate: (
    app: JupyterFrontEnd,
    mainMenu: IMainMenu,
    palette: ICommandPalette | null
  ) => {
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
    nbgraderMenu.addItem({ command: commandIDs.openBulkAutograde });

    mainMenu.addMenu(nbgraderMenu);

    console.log('JupyterLab extension {} is activated!', pluginIDs.menus);
  }
};

/**
 * History page plugin.
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
    const tracker = new WidgetTracker<MainAreaWidget<HistoryWidget>>({
      namespace: 'nbexchange-history'
    });

    app.commands.addCommand(commandIDs.openHistory, {
      label: 'Exchange History',
      isEnabled: () => {
        return true;
      },
      execute: () => {
        if (!widget || widget.isDisposed) {
          const content = new HistoryWidget(app);
          widget = new MainAreaWidget({ content });
          widget.id = 'nbexchange-history';
          widget.addClass('nbgrader-mainarea-widget');
          widget.title.label = 'Exchange History';
          widget.title.closable = true;
        }
        if (!tracker.has(widget)) {
          // Track the state of the widget for later restoration
          tracker.add(widget);
        }

        // Attach the widget to the main area if it's not there
        if (!widget.isAttached) {
          if (notebookTree) {
            notebookTree.addWidget(widget);
            notebookTree.currentWidget = widget;
          } else {
            app.shell.add(widget, 'main');
          }
        }

        widget.content.update();

        app.shell.activateById(widget.id);
      }
    });

    // Restore the widget state
    if (restorer !== null) {
      restorer.restore(tracker, {
        command: commandIDs.openHistory,
        name: () => 'nbexchange-history'
      });
    }

    console.log('JupyterLab extension {} is activated!', pluginIDs.history);
  }
};

/**
 * Bulk Autograde page plugin.
 */
const bulkAutogradeExtension: JupyterFrontEndPlugin<void> = {
  id: pluginIDs.bulkAutograde,
  autoStart: true,
  optional: [ILayoutRestorer, INotebookTree],
  activate: (
    app: JupyterFrontEnd,
    restorer: ILayoutRestorer | null,
    notebookTree: INotebookTree | null
  ) => {
    // Declare a widget variable
    let widget: MainAreaWidget<BulkAutogradeWidget>;

    // Track the widget state
    const tracker = new WidgetTracker<MainAreaWidget<BulkAutogradeWidget>>({
      namespace: 'nbexchange-bulkAutograde'
    });

    app.commands.addCommand(commandIDs.openBulkAutograde, {
      label: 'Bulk Autograding',
      isEnabled: () => {
        return true;
      },
      execute: () => {
        if (!widget || widget.isDisposed) {
          const content = new BulkAutogradeWidget(app);
          widget = new MainAreaWidget({ content });
          widget.id = 'nbexchange-bulkAutograde';
          widget.addClass('nbgrader-mainarea-widget');
          widget.title.label = 'Bulk Autograding';
          widget.title.closable = true;
        }
        if (!tracker.has(widget)) {
          // Track the state of the widget for later restoration
          tracker.add(widget);
        }

        // Attach the widget to the main area if it's not there
        if (!widget.isAttached) {
          if (notebookTree) {
            notebookTree.addWidget(widget);
            notebookTree.currentWidget = widget;
          } else {
            app.shell.add(widget, 'main');
          }
        }

        widget.content.update();

        app.shell.activateById(widget.id);
      }
    });

    // Restore the widget state
    if (restorer !== null) {
      restorer.restore(tracker, {
        command: commandIDs.openBulkAutograde,
        name: () => 'nbexchange-bulkAutograde'
      });
    }

    console.log(
      'JupyterLab extension {} is activated!',
      pluginIDs.bulkAutograde
    );
  }
};

export default [menuExtension, historyListExtension, bulkAutogradeExtension];
