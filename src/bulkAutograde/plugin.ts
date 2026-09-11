import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette, MainAreaWidget } from '@jupyterlab/apputils';

import { BulkAutogradeWidget } from './index';
import { commandIDs } from '../index';

const BULK_AUTOGRADE_PLUGIN_ID = '@jupyter/nbexchange:bulk-autograde';

export const bulkAutogradePlugin: JupyterFrontEndPlugin<void> = {
  id: BULK_AUTOGRADE_PLUGIN_ID,
  description: 'NbExchange Bulk Autograder',
  autoStart: true,
  optional: [ICommandPalette],
  activate: (app: JupyterFrontEnd, palette: ICommandPalette | null) => {
    const bulkAutogradeWidget = new BulkAutogradeWidget(app);
    const main = new MainAreaWidget({ content: bulkAutogradeWidget });

    main.id = 'nbexchange-bulk-autograde';
    main.title.label = 'Bulk Autograde';
    main.title.closable = true;

    const command = commandIDs.openBulkAutograde;
    app.commands.addCommand(command, {
      label: 'NbExchange Bulk Autograde',
      execute: () => {
        if (!main.isAttached) {
          app.shell.add(main, 'main');
        }
        app.shell.activateById(main.id);
      }
    });

    if (palette) {
      palette.addItem({
        command: command,
        category: 'NbExchange'
      });
    }
  }
};

export default bulkAutogradePlugin;
