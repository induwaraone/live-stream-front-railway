import { useState } from 'react';
import ClassroomPage from './pages/ClassroomPage';

function App() {
    const [inClass, setInClass] = useState(false);

    if (inClass) {
        return (
            <ClassroomPage
                roomName="Math101"
                studentName="Student_John"
                onLeave={() => setInClass(false)}
            />
        );
    }

    return (
        <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h1>Welcome to the LMS Dashboard</h1>
            <p>Your next class is ready.</p>
            <button
                onClick={() => setInClass(true)}
                style={{ padding: '10px 20px', fontSize: '18px', cursor: 'pointer' }}
            >
                Join Live Class
            </button>
        </div>
    );
}

export default App;