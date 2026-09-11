import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { Menu } from '@lumino/widgets';

/**
 * The plugin ID
 */
const pluginID = '@jupyter/nbexchange:menu';

/**
 * The command IDs (shared with other nbexchange extensions)
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
 * Menu plugin - provides Nbgrader menu with commands from all nbexchange extensions.
 * This plugin is optional and can be disabled independently.
 */
const menuPlugin: JupyterFrontEndPlugin<void> = {
  id: pluginID,
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

    // Add commands if they exist (provided by other extensions)
    if (app.commands.hasCommand(commandIDs.openHistory)) {
      if (palette) {
        palette.addItem({
          command: commandIDs.openHistory,
          category: 'NbExchange'
        });
      }
      nbgraderMenu.addItem({ command: commandIDs.openHistory });
    }

    nbgraderMenu.addItem({ command: commandIDs.openAssignmentsList });
    nbgraderMenu.addItem({ command: commandIDs.openCoursesList });
    nbgraderMenu.addItem({ command: commandIDs.openFormgrader });
    nbgraderMenu.addItem({ command: commandIDs.openFormgraderLocal });

    if (app.commands.hasCommand(commandIDs.openBulkAutograde)) {
      nbgraderMenu.addItem({ command: commandIDs.openBulkAutograde });
    }

    mainMenu.addMenu(nbgraderMenu);
  }
};

export default menuPlugin;
