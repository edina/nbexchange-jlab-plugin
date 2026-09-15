/**
 * Unit tests for FeatureStatusService
 */

import { FeatureStatusService } from '../featureStatus';
import * as handler from '../handler';

jest.mock('../handler');

describe('FeatureStatusService', () => {
  let service: FeatureStatusService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FeatureStatusService();
  });

  afterEach(() => {
    if (!service.isDisposed) {
      service.dispose();
    }
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(service.historyEnabled).toBe(false);
      expect(service.bulkAutogradeEnabled).toBe(false);
      expect(service.isReady).toBe(false);
    });

    it('should not be disposed initially', () => {
      expect(service.isDisposed).toBe(false);
    });
  });

  describe('refresh', () => {
    it('should update feature status on successful refresh', async () => {
      const mockGetFeatureStatus = jest.fn().mockResolvedValue({
        history: false,
        bulk_autograde: true,
        general: true
      });
      (handler.getFeatureStatus as jest.Mock) = mockGetFeatureStatus;

      await service.refresh();

      expect(service.isReady).toBe(true);
      expect(service.historyEnabled).toBe(false);
      expect(service.bulkAutogradeEnabled).toBe(true);
    });

    it('should handle API errors gracefully', async () => {
      const mockGetFeatureStatus = jest
        .fn()
        .mockRejectedValue(new Error('Network error'));
      (handler.getFeatureStatus as jest.Mock) = mockGetFeatureStatus;

      await service.refresh();

      expect(service.isReady).toBe(true);
      expect(service.historyEnabled).toBe(false);
      expect(service.bulkAutogradeEnabled).toBe(false);
    });

    it('should handle malformed response gracefully', async () => {
      const mockGetFeatureStatus = jest
        .fn()
        .mockRejectedValue(new Error('Invalid response'));
      (handler.getFeatureStatus as jest.Mock) = mockGetFeatureStatus;

      await service.refresh();

      expect(service.isReady).toBe(true);
    });
  });

  describe('signals', () => {
    it('should emit historyEnabledChanged when history status changes', async () => {
      const mockGetFeatureStatus1 = jest.fn().mockResolvedValue({
        history: true,
        bulk_autograde: true,
        general: true
      });
      const mockGetFeatureStatus2 = jest.fn().mockResolvedValue({
        history: false,
        bulk_autograde: true,
        general: true
      });

      (handler.getFeatureStatus as jest.Mock) = mockGetFeatureStatus1;
      await service.refresh();

      const historyChangedCallback = jest.fn();
      service.historyEnabledChanged.connect((sender, enabled) => {
        historyChangedCallback(enabled);
      });

      (handler.getFeatureStatus as jest.Mock) = mockGetFeatureStatus2;
      await service.refresh();

      expect(historyChangedCallback).toHaveBeenCalledWith(false);
      expect(historyChangedCallback).toHaveBeenCalledTimes(1);
    });

    it('should emit bulkAutogradeEnabledChanged when bulk autograde status changes', async () => {
      const mockGetFeatureStatus1 = jest.fn().mockResolvedValue({
        history: true,
        bulk_autograde: true,
        general: true
      });
      const mockGetFeatureStatus2 = jest.fn().mockResolvedValue({
        history: true,
        bulk_autograde: false,
        general: true
      });

      (handler.getFeatureStatus as jest.Mock) = mockGetFeatureStatus1;
      await service.refresh();

      const bulkAutogradeChangedCallback = jest.fn();
      service.bulkAutogradeEnabledChanged.connect((sender, enabled) => {
        bulkAutogradeChangedCallback(enabled);
      });

      (handler.getFeatureStatus as jest.Mock) = mockGetFeatureStatus2;
      await service.refresh();

      expect(bulkAutogradeChangedCallback).toHaveBeenCalledWith(false);
      expect(bulkAutogradeChangedCallback).toHaveBeenCalledTimes(1);
    });

    it('should not emit signals when status does not change', async () => {
      const mockGetFeatureStatus = jest.fn().mockResolvedValue({
        history: true,
        bulk_autograde: true,
        general: true
      });

      (handler.getFeatureStatus as jest.Mock) = mockGetFeatureStatus;
      await service.refresh();

      const historyChangedCallback = jest.fn();
      const bulkAutogradeChangedCallback = jest.fn();

      service.historyEnabledChanged.connect(() => {
        historyChangedCallback();
      });
      service.bulkAutogradeEnabledChanged.connect(() => {
        bulkAutogradeChangedCallback();
      });

      await service.refresh();

      expect(historyChangedCallback).not.toHaveBeenCalled();
      expect(bulkAutogradeChangedCallback).not.toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('should set isDisposed to true after disposal', () => {
      service.dispose();
      expect(service.isDisposed).toBe(true);
    });

    it('should be idempotent', () => {
      service.dispose();
      expect(() => service.dispose()).not.toThrow();
      expect(service.isDisposed).toBe(true);
    });

    it('should clear signal data', () => {
      const callback = jest.fn();
      service.historyEnabledChanged.connect(() => {
        callback();
      });

      service.dispose();
      expect(service.isDisposed).toBe(true);
    });
  });

  describe('getters', () => {
    it('should return correct historyEnabled value', async () => {
      const mockGetFeatureStatus = jest.fn().mockResolvedValue({
        history: false,
        bulk_autograde: true,
        general: true
      });
      (handler.getFeatureStatus as jest.Mock) = mockGetFeatureStatus;

      await service.refresh();
      expect(service.historyEnabled).toBe(false);
    });

    it('should return correct bulkAutogradeEnabled value', async () => {
      const mockGetFeatureStatus = jest.fn().mockResolvedValue({
        history: true,
        bulk_autograde: false,
        general: true
      });
      (handler.getFeatureStatus as jest.Mock) = mockGetFeatureStatus;

      await service.refresh();
      expect(service.bulkAutogradeEnabled).toBe(false);
    });

    it('should return correct isReady value after refresh', async () => {
      const mockGetFeatureStatus = jest.fn().mockResolvedValue({
        history: true,
        bulk_autograde: true,
        general: true
      });
      (handler.getFeatureStatus as jest.Mock) = mockGetFeatureStatus;

      expect(service.isReady).toBe(false);
      await service.refresh();
      expect(service.isReady).toBe(true);
    });
  });
});
