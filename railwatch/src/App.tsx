import { useState, useCallback } from 'react';
import type { DataProvider } from './types';
import { DataProviderContext } from './context/DataProviderContext';
import { CutOffContextProvider } from './context/CutOffContext';
import { SimulatorDataProvider } from './providers/SimulatorDataProvider';
import DemoModeBanner from './components/DemoModeBanner';
import FirstRunOverlay from './components/FirstRunOverlay';

function App() {
  const [provider, setProvider] = useState<DataProvider>(
    () => new SimulatorDataProvider()
  );
  const [generatedAt, setGeneratedAt] = useState<Date>(() => new Date());

  const refresh = useCallback(() => {
    setProvider(new SimulatorDataProvider());
    setGeneratedAt(new Date());
  }, []);

  return (
    <DataProviderContext.Provider value={provider}>
      <CutOffContextProvider>
        <DemoModeBanner />
        {/* StatusBar placeholder — wired in task 28 */}
        <div id="status-bar-placeholder" />
        <FirstRunOverlay />
        <main className="p-4 space-y-6">
          {/* RailHealthOverview — task 15 */}
          <section id="rail-health-overview-placeholder" />
          {/* ExceptionQueueMonitor — task 16 */}
          <section id="exception-queue-placeholder" />
          {/* SettlementPositionTracker — task 19 */}
          <section id="settlement-position-placeholder" />
          {/* CutOffTimeMonitor — task 20 */}
          <section id="cutoff-monitor-placeholder" />
          {/* MarketContextPanel — task 26 */}
          <section id="market-context-placeholder" />
          {/* DailySummaryExport — task 27 */}
          <section id="daily-summary-placeholder" />
        </main>
      </CutOffContextProvider>
    </DataProviderContext.Provider>
  );
}

export default App;
