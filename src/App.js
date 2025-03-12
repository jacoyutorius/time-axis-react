import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import TimeAxis from './components/TimeAxis';
import { RecordsProvider } from './context/RecordsContext';

function App() {
  return (
    <div className="App">
      <RecordsProvider>
        <TimeAxis />
      </RecordsProvider>
    </div>
  );
}

export default App;
