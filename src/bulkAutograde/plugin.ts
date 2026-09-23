import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette, MainAreaWidget } from '@jupyterlab/apputils';

import { BulkAutogradeWidget } from './index';
import { commandIDs } from '../index';
import { IFeatureStatus } from '../featureStatus';

const BULK_AUTOGRADE_PLUGIN_ID = '@jupyter/nbexchange:bulk-autograde';

export const bulkAutogradePlugin: JupyterFrontEndPlugin<void> = {
  id: BULK_AUTOGRADE_PLUGIN_ID,
  description:
    'A Bulk Autograder: Autogrades all submissions for a given assignment without stopping at the first error.',
  autoStart: true,
  requires: [IFeatureStatus],
  optional: [ICommandPalette],
  activate: (
    app: JupyterFrontEnd,
    featureStatus: IFeatureStatus,
    palette: ICommandPalette | null
  ) => {
    const bulkAutogradeWidget = new BulkAutogradeWidget(app);
    const main = new MainAreaWidget({ content: bulkAutogradeWidget });

    main.id = 'nbexchange-bulk-autograde';
    main.title.label = 'Bulk Autograde';
    main.title.closable = true;

    const command = commandIDs.openBulkAutograde;
    app.commands.addCommand(command, {
      label: 'Bulk Autograde',
      execute: () => {
        if (!main.isAttached) {
          app.shell.add(main, 'main');
        }
        app.shell.activateById(main.id);
      },
      isEnabled: () =>
        featureStatus.isReady && featureStatus.bulkAutogradeEnabled
    });

    if (palette) {
      palette.addItem({
        command: command,
        category: 'NbExchange'
      });
    }

    featureStatus.bulkAutogradeEnabledChanged.connect(() => {
      app.commands.notifyCommandChanged(command);
    });
  }
};

export default bulkAutogradePlugin;
