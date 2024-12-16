
// import React, { useState, useEffect, useRef } from 'react';
// import { io } from 'socket.io-client';
// import './App.css';

// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
// const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';
// const socket = io(SOCKET_URL, {
//   transports: ['websocket'],
// });

// const App = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [userId, setUserId] = useState(null);
//   const [users, setUsers] = useState([]);
//   const [filteredUsers, setFilteredUsers] = useState([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [roomId, setRoomId] = useState('');
//   const [localStream, setLocalStream] = useState(null);
//   const [peerConnection, setPeerConnection] = useState(null);
//   const [remoteStream, setRemoteStream] = useState(null);
//   const [callInProgress, setCallInProgress] = useState(false);
//   const [callDuration, setCallDuration] = useState('00:00');

//   const timerInterval = useRef(null);
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);

//   useEffect(() => {
//     socket.on('connect', () => {
//       console.log('Connected to server:', socket.id);
//     });

//     socket.on('user-connected', (message) => {
//       console.log(message);
//     });

//     socket.on('user-disconnected', (message) => {
//       console.log(message);
//     });

//     socket.on('offer', handleOffer);
//     socket.on('answer', handleAnswer);
//     socket.on('candidate', handleCandidate);

//     return () => {
//       socket.off('connect');
//       socket.off('user-connected');
//       socket.off('user-disconnected');
//       socket.off('offer');
//       socket.off('answer');
//       socket.off('candidate');
//     };
//   }, [localStream, peerConnection]);

//   useEffect(() => {
//     if (userId) {
//       fetchUsers();
//     }
//   }, [userId]);

//   const fetchUsers = async () => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/users`);
//       const usersData = await response.json();
//       const filtered = usersData.filter((user) => user._id !== userId);
//       setUsers(filtered);
//       setFilteredUsers(filtered);
//     } catch (error) {
//       console.error('Failed to fetch users:', error.message);
//     }
//   };

//   const handleSignup = async () => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/signup`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password }),
//       });
//       const data = await response.json();
//       alert(data.message);
//     } catch (error) {
//       console.error('Signup failed:', error);
//     }
//   };

//   const handleLogin = async () => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/login`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password }),
//       });
//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || 'Login failed');
//       }

//       setUserId(data.userId);  // Assuming the backend sends a userId upon successful login
//       alert('Login successful');
//     } catch (error) {
//       alert(error.message);
//       console.error('Login failed:', error.message);
//     }
//   };

//   const handleSearch = (e) => {
//     const query = e.target.value.toLowerCase();
//     setSearchQuery(query);
//     const filtered = users.filter((user) => user.email.toLowerCase().includes(query));
//     setFilteredUsers(filtered);
//   };

//   const sendRequest = async (recipientId) => {
//     if (!userId) {
//       alert('Please log in to send a request.');
//       return;
//     }

//     try {
//       const response = await fetch(`${API_BASE_URL}/api/send-request`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ senderId: userId, recipientId }),
//       });
//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || 'Failed to send request.');
//       }

//       alert('Request sent successfully.');
//     } catch (error) {
//       alert(error.message);
//       console.error('Failed to send request:', error.message);
//     }
//   };

//   const joinRoom = () => {
//     if (!roomId) {
//       alert('No room ID provided.');
//       return;
//     }
//     socket.emit('join-room', roomId);
//     alert(`Joined room: ${roomId}`);
//     startCall();
//   };

//   const startCall = async () => {
//     try {
//       const localStream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });
//       setLocalStream(localStream);
//       if (localVideoRef.current) {
//         localVideoRef.current.srcObject = localStream;
//       }

//       const peerConnection = new RTCPeerConnection({
//         iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
//       });

//       peerConnection.ontrack = (event) => {
//         setRemoteStream(event.streams[0]);
//         if (remoteVideoRef.current) {
//           remoteVideoRef.current.srcObject = event.streams[0];
//         }
//       };

//       peerConnection.onicecandidate = (event) => {
//         if (event.candidate) {
//           socket.emit('candidate', { roomId, candidate: event.candidate });
//         }
//       };

//       localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

//       const offer = await peerConnection.createOffer();
//       await peerConnection.setLocalDescription(offer);
//       socket.emit('offer', { roomId, offer });

//       setPeerConnection(peerConnection);
//       setCallInProgress(true);

//       const startTime = Date.now();
//       timerInterval.current = setInterval(() => {
//         const elapsed = Date.now() - startTime;
//         const minutes = Math.floor(elapsed / 60000);
//         const seconds = Math.floor((elapsed % 60000) / 1000);
//         setCallDuration(
//           `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
//         );
//       }, 1000);
//     } catch (error) {
//       console.error('Error starting call:', error);
//     }
//   };

//   const endCall = () => {
//     if (peerConnection) {
//       peerConnection.close();
//       setPeerConnection(null);
//     }

//     if (localStream) {
//       localStream.getTracks().forEach((track) => track.stop());
//       setLocalStream(null);
//     }

//     if (remoteStream) {
//       setRemoteStream(null);
//     }

//     setCallInProgress(false);

//     if (timerInterval.current) {
//       clearInterval(timerInterval.current);
//       timerInterval.current = null;
//     }

//     setCallDuration('00:00');
//   };

//   const handleOffer = async (offer) => {
//     const peerConnection = new RTCPeerConnection({
//       iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
//     });

//     peerConnection.ontrack = (event) => {
//       setRemoteStream(event.streams[0]);
//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = event.streams[0];
//       }
//     };

//     peerConnection.onicecandidate = (event) => {
//       if (event.candidate) {
//         socket.emit('candidate', { roomId, candidate: event.candidate });
//       }
//     };

//     localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

//     await peerConnection.setRemoteDescription(offer);
//     const answer = await peerConnection.createAnswer();
//     await peerConnection.setLocalDescription(answer);
//     socket.emit('answer', { roomId, answer });

//     setPeerConnection(peerConnection);
//   };

//   const handleAnswer = async (answer) => {
//     await peerConnection.setRemoteDescription(answer);
//   };

//   const handleCandidate = async (candidate) => {
//     try {
//       await peerConnection.addIceCandidate(candidate);
//     } catch (e) {
//       console.error('Error adding received ICE candidate', e);
//     }
//   };

//   return (
//     <div className="app-container">
//       <h1 className="app-header">Video Call App</h1>

//       {!userId ? (
//         <div className="auth-section">
//           <input
//             type="email"
//             className="auth-input"
//             placeholder="Email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//           />
//           <input
//             type="password"
//             className="auth-input"
//             placeholder="Password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//           />
//           <button className="auth-button" onClick={handleSignup}>
//             Sign Up
//           </button>
//           <button className="auth-button" onClick={handleLogin}>
//             Login
//           </button>
//         </div>
//       ) : (
//         <p>Welcome, {email}</p>
//       )}

//       {userId && (
//         <div className="users-section">
//           <input
//             type="text"
//             className="search-box"
//             placeholder="Search Users"
//             value={searchQuery}
//             onChange={handleSearch}
//           />
//           <div className="user-cards-container">
//             {filteredUsers.map((user) => (
//               <div key={user._id} className="user-card">
//                 <h3>{user.email}</h3>
//                 <button onClick={() => sendRequest(user._id)}>Send Request</button>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       <div className="room-section">
//         <input
//           type="text"
//           className="room-input"
//           placeholder="Room ID"
//           value={roomId}
//           onChange={(e) => setRoomId(e.target.value)}
//         />
//         <button className="join-room" onClick={joinRoom}>
//           Join Room
//         </button>
//       </div>

//       {callInProgress && <div className="call-timer">Call Duration: {callDuration}</div>}

//       <button
//         className={callInProgress ? 'end-call-button' : 'call-button'}
//         onClick={callInProgress ? endCall : startCall}
//       >
//         {callInProgress ? 'End Call' : 'Start Call'}
//       </button>

//       <div className="video-container">
//         {localStream && <video ref={localVideoRef} className="local-video" autoPlay playsInline muted />}
//         {remoteStream && <video ref={remoteVideoRef} className="remote-video" autoPlay playsInline />}
//       </div>
//     </div>
//   );
// };

// export default App;
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';
const socket = io(SOCKET_URL, {
  transports: ['websocket'],
});

const App = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roomId, setRoomId] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callInProgress, setCallInProgress] = useState(false);
  const [callDuration, setCallDuration] = useState('00:00');

  const timerInterval = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
    });

    socket.on('user-connected', (message) => {
      console.log(message);
    });

    socket.on('user-disconnected', (message) => {
      console.log(message);
    });

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('candidate', handleCandidate);

    return () => {
      socket.off('connect');
      socket.off('user-connected');
      socket.off('user-disconnected');
      socket.off('offer');
      socket.off('answer');
      socket.off('candidate');
    };
  }, [localStream, peerConnection]);

  useEffect(() => {
    if (userId) {
      fetchUsers();
    }
  }, [userId]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`);
      const usersData = await response.json();
      const filtered = usersData.filter((user) => user._id !== userId);
      setUsers(filtered);
      setFilteredUsers(filtered);
    } catch (error) {
      console.error('Failed to fetch users:', error.message);
    }
  };

  const handleSignup = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      console.error('Signup failed:', error);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      setUserId(data.userId);
      alert('Login successful');
    } catch (error) {
      alert(error.message);
      console.error('Login failed:', error.message);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = users.filter((user) => user.email.toLowerCase().includes(query));
    setFilteredUsers(filtered);
  };

  const sendRequest = async (recipientId) => {
    if (!userId) {
      alert('Please log in to send a request.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/send-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: userId, recipientId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send request.');
      }

      alert('Request sent successfully.');
    } catch (error) {
      alert(error.message);
      console.error('Failed to send request:', error.message);
    }
  };

  const joinRoom = () => {
    if (!roomId) {
      alert('No room ID provided.');
      return;
    }
    socket.emit('join-room', roomId);
    alert(`Joined room: ${roomId}`);
    startCall();
  };

  const startCall = async () => {
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(localStream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      peerConnection.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('candidate', { roomId, candidate: event.candidate });
        }
      };

      localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('offer', { roomId, offer });

      setPeerConnection(peerConnection);
      setCallInProgress(true);

      const startTime = Date.now();
      timerInterval.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        setCallDuration(
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  const endCall = () => {
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    if (remoteStream) {
      setRemoteStream(null);
    }

    setCallInProgress(false);

    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }

    setCallDuration('00:00');
  };

  const handleOffer = async (offer) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    peerConnection.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('candidate', { roomId, candidate: event.candidate });
      }
    };

    localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', { roomId, answer });

    setPeerConnection(peerConnection);
  };

  const handleAnswer = async (answer) => {
    await peerConnection.setRemoteDescription(answer);
  };

  const handleCandidate = async (candidate) => {
    try {
      await peerConnection.addIceCandidate(candidate);
    } catch (e) {
      console.error('Error adding received ICE candidate', e);
    }
  };

  return (
    <div className="app-container">
      <h1 className="app-header">Video Call App</h1>

      {!userId ? (
        <div className="auth-section">
          <input
            type="email"
            className="auth-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="auth-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="auth-button" onClick={handleSignup}>
            Sign Up
          </button>
          <button className="auth-button" onClick={handleLogin}>
            Login
          </button>
        </div>
      ) : (
        <p>Welcome, {email}</p>
      )}

      {userId && (
        <div className="users-section">
          <input
            type="text"
            className="search-box"
            placeholder="Search Users"
            value={searchQuery}
            onChange={handleSearch}
          />
          <div className="user-cards-container">
            {filteredUsers.map((user) => (
              <div key={user._id} className="user-card">
                <h3>{user.email}</h3>
                <button onClick={() => sendRequest(user._id)}>Send Request</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="room-section">
        <input
          type="text"
          className="room-input"
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button className="join-room" onClick={joinRoom}>
          Join Room
        </button>
      </div>

      {callInProgress && <div className="call-timer">Call Duration: {callDuration}</div>}

      <button
        className={callInProgress ? 'end-call-button' : 'call-button'}
        onClick={callInProgress ? endCall : startCall}
      >
        {callInProgress ? 'End Call' : 'Start Call'}
      </button>

      <div className="video-container">
        {localStream && <video ref={localVideoRef} className="local-video" autoPlay playsInline muted />}
        {remoteStream && <video ref={remoteVideoRef} className="remote-video" autoPlay playsInline />}
      </div>
    </div>
  );
};

export default App;












// import React, { useState, useEffect, useRef } from 'react';
// import { io } from 'socket.io-client';
// import './App.css';

// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
// const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';

// const socket = io(SOCKET_URL, {
//   transports: ['websocket'],
// });

// const App = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [userId, setUserId] = useState(null);
//   const [users, setUsers] = useState([]);
//   const [filteredUsers, setFilteredUsers] = useState([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [roomId, setRoomId] = useState('');
//   const [localStream, setLocalStream] = useState(null);
//   const [peerConnection, setPeerConnection] = useState(null);
//   const [remoteStream, setRemoteStream] = useState(null);
//   const [callInProgress, setCallInProgress] = useState(false);
//   const [callDuration, setCallDuration] = useState('00:00');

//   const timerInterval = useRef(null);
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);

//   useEffect(() => {
//     socket.on('connect', () => {
//       console.log('Connected to server:', socket.id);
//     });

//     socket.on('user-connected', (message) => {
//       console.log(message);
//     });

//     socket.on('user-disconnected', (message) => {
//       console.log(message);
//     });

//     socket.on('offer', handleOffer);
//     socket.on('answer', handleAnswer);
//     socket.on('candidate', handleCandidate);

//     return () => {
//       socket.off('connect');
//       socket.off('user-connected');
//       socket.off('user-disconnected');
//       socket.off('offer');
//       socket.off('answer');
//       socket.off('candidate');
//     };
//   }, [localStream, peerConnection]);

//   const handleSignup = async () => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/signup`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password }),
//       });
//       const data = await response.json();
//       alert(data.message);
//     } catch (error) {
//       console.error('Signup failed:', error);
//     }
//   };

//   const handleLogin = async () => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/login`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password }),
//       });
//       const data = await response.json();
//       if (!response.ok) {
//         throw new Error(data.error || 'Login failed');
//       }
//       setUserId(data.userId);
//       alert('Login successful');
//     } catch (error) {
//       alert(error.message);
//       console.error('Login failed:', error.message);
//     }
//   };

//   const loadUsers = async () => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/users`);
//       const usersData = await response.json();
//       const filtered = usersData.filter((user) => user._id !== userId);
//       setUsers(filtered);
//       setFilteredUsers(filtered);
//     } catch (error) {
//       console.error('Failed to load users:', error.message);
//     }
//   };

//   const handleSearch = (e) => {
//     const query = e.target.value.toLowerCase();
//     setSearchQuery(query);
//     const filtered = users.filter((user) => user.email.toLowerCase().includes(query));
//     setFilteredUsers(filtered);
//   };

//   const sendRequest = async (recipientId) => {
//     if (!userId) {
//       alert('Please log in to send a request.');
//       return;
//     }

//     try {
//       const response = await fetch(`${API_BASE_URL}/api/send-request`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ senderId: userId, recipientId }),
//       });
//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || 'Failed to send request.');
//       }

//       alert('Request sent successfully.');
//     } catch (error) {
//       alert(error.message);
//       console.error('Failed to send request:', error.message);
//     }
//   };

//   const joinRoom = () => {
//     if (!roomId) {
//       alert('No room ID provided.');
//       return;
//     }
//     socket.emit('join-room', roomId);
//     alert(`Joined room: ${roomId}`);
//     startCall();
//   };

//   const startCall = async () => {
//     try {
//       const localStream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });
//       setLocalStream(localStream);
//       if (localVideoRef.current) {
//         localVideoRef.current.srcObject = localStream;
//       }

//       const peerConnection = new RTCPeerConnection({
//         iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
//       });

//       peerConnection.ontrack = (event) => {
//         setRemoteStream(event.streams[0]);
//         if (remoteVideoRef.current) {
//           remoteVideoRef.current.srcObject = event.streams[0];
//         }
//       };

//       peerConnection.onicecandidate = (event) => {
//         if (event.candidate) {
//           socket.emit('candidate', { roomId, candidate: event.candidate });
//         }
//       };

//       localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

//       const offer = await peerConnection.createOffer();
//       await peerConnection.setLocalDescription(offer);
//       socket.emit('offer', { roomId, offer });

//       setPeerConnection(peerConnection);
//       setCallInProgress(true);

//       const startTime = Date.now();
//       timerInterval.current = setInterval(() => {
//         const elapsed = Date.now() - startTime;
//         const minutes = Math.floor(elapsed / 60000);
//         const seconds = Math.floor((elapsed % 60000) / 1000);
//         setCallDuration(
//           `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
//         );
//       }, 1000);
//     } catch (error) {
//       console.error('Error starting call:', error);
//     }
//   };

//   const endCall = () => {
//     if (peerConnection) {
//       peerConnection.close();
//       setPeerConnection(null);
//     }

//     if (localStream) {
//       localStream.getTracks().forEach((track) => track.stop());
//       setLocalStream(null);
//     }

//     if (remoteStream) {
//       setRemoteStream(null);
//     }

//     setCallInProgress(false);

//     if (timerInterval.current) {
//       clearInterval(timerInterval.current);
//       timerInterval.current = null;
//     }

//     setCallDuration('00:00');
//   };

//   const handleOffer = async (offer) => {
//     const peerConnection = new RTCPeerConnection({
//       iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
//     });

//     peerConnection.ontrack = (event) => {
//       setRemoteStream(event.streams[0]);
//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = event.streams[0];
//       }
//     };

//     peerConnection.onicecandidate = (event) => {
//       if (event.candidate) {
//         socket.emit('candidate', { roomId, candidate: event.candidate });
//       }
//     };

//     localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

//     await peerConnection.setRemoteDescription(offer);
//     const answer = await peerConnection.createAnswer();
//     await peerConnection.setLocalDescription(answer);
//     socket.emit('answer', { roomId, answer });

//     setPeerConnection(peerConnection);
//   };

//   const handleAnswer = async (answer) => {
//     await peerConnection.setRemoteDescription(answer);
//   };

//   const handleCandidate = async (candidate) => {
//     try {
//       await peerConnection.addIceCandidate(candidate);
//     } catch (e) {
//       console.error('Error adding received ICE candidate', e);
//     }
//   };

//   return (
//     <div className="app-container">
//       <h1 className="app-header">Video Call App</h1>

//       {!userId ? (
//         <div className="auth-section">
//           <input
//             type="email"
//             className="auth-input"
//             placeholder="Email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//           />
//           <input
//             type="password"
//             className="auth-input"
//             placeholder="Password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//           />
//           <button className="auth-button" onClick={handleSignup}>
//             Sign Up
//           </button>
//           <button className="auth-button" onClick={handleLogin}>
//             Login
//           </button>
//         </div>
//       ) : (
//         <div className="dropdown-menu">
//           <button onClick={loadUsers}>Load Users</button>
//           <p>Welcome, {email}</p>
//         </div>
//       )}

//       {userId && (
//         <div className="users-section">
//           <input
//             type="text"
//             className="search-box"
//             placeholder="Search Users"
//             value={searchQuery}
//             onChange={handleSearch}
//           />
//           <div className="user-cards-container">
//             {filteredUsers.map((user) => (
//               <div key={user._id} className="user-card">
//                 <h3>{user.email}</h3>
//                 <button onClick={() => sendRequest(user._id)}>Send Request</button>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       <div className="room-section">
//         <input
//           type="text"
//           className="room-input"
//           placeholder="Room ID"
//           value={roomId}
//           onChange={(e) => setRoomId(e.target.value)}
//         />
//         <button className="join-room" onClick={joinRoom}>
//           Join Room
//         </button>
//       </div>

//       {callInProgress && <div className="call-timer">Call Duration: {callDuration}</div>}

//       <button
//         className={callInProgress ? 'end-call-button' : 'call-button'}
//         onClick={callInProgress ? endCall : startCall}
//       >
//         {callInProgress ? 'End Call' : 'Start Call'}
//       </button>

//       <div className="video-container">
//         {localStream && <video ref={localVideoRef} className="local-video" autoPlay playsInline muted />}
//         {remoteStream && <video ref={remoteVideoRef} className="remote-video" autoPlay playsInline />}
//       </div>
//     </div>
//   );
// };

// export default App;



// // Frontend: Updated App.js
// import React, { useState, useEffect, useRef } from 'react';
// import { io } from 'socket.io-client';
// import './App.css';

// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
// const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';

// const socket = io(SOCKET_URL, {
//   transports: ['websocket'],
// });

// const App = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [userId, setUserId] = useState(null);
//   const [users, setUsers] = useState([]);
//   const [roomId, setRoomId] = useState('');
//   const [localStream, setLocalStream] = useState(null);
//   const [peerConnection, setPeerConnection] = useState(null);
//   const [remoteStream, setRemoteStream] = useState(null);
//   const [callInProgress, setCallInProgress] = useState(false);
//   const [callDuration, setCallDuration] = useState('00:00');

//   const timerInterval = useRef(null);
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);

//   useEffect(() => {
//     socket.on('connect', () => {
//       console.log('Connected to server:', socket.id);
//     });

//     socket.on('user-joined', (userId) => {
//       console.log('A user joined the room:', userId);
//     });

//     socket.on('offer', handleOffer);
//     socket.on('answer', handleAnswer);
//     socket.on('candidate', handleCandidate);

//     return () => {
//       socket.off('connect');
//       socket.off('user-joined');
//       socket.off('offer');
//       socket.off('answer');
//       socket.off('candidate');
//     };
//   }, [localStream, peerConnection]);

//   const handleSignup = async () => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/signup`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password }),
//       });
//       const data = await response.json();
//       alert(data.message);
//     } catch (error) {
//       console.error('Signup failed:', error);
//     }
//   };

//   const handleLogin = async () => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/login`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password }),
//       });
//       const data = await response.json();
//       if (!response.ok) {
//         throw new Error(data.error || 'Login failed');
//       }
//       setUserId(data.userId);
//       alert('Login successful');
//     } catch (error) {
//       alert(error.message);
//       console.error('Login failed:', error.message);
//     }
//   };

//   const loadUsers = async () => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/users`);
//       const usersData = await response.json();
//       setUsers(usersData.filter((user) => user._id !== userId));
//     } catch (error) {
//       console.error('Failed to load users:', error.message);
//     }
//   };

//   const sendRequest = async (recipientId) => {
//     if (!userId) {
//       alert('Please log in to send a request.');
//       return;
//     }

//     try {
//       const response = await fetch(`${API_BASE_URL}/api/send-request`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ senderId: userId, recipientId }),
//       });
//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || 'Failed to send request.');
//       }

//       alert('Request sent successfully.');
//     } catch (error) {
//       alert(error.message);
//       console.error('Failed to send request:', error.message);
//     }
//   };

//   const joinRoom = () => {
//     if (!roomId) {
//       alert('No room ID provided.');
//       return;
//     }
//     socket.emit('join-room', roomId);
//     alert(`Joined room: ${roomId}`);
//     startCall();
//   };

//   const startCall = async () => {
//     try {
//       const localStream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });
//       setLocalStream(localStream);
//       if (localVideoRef.current) {
//         localVideoRef.current.srcObject = localStream;
//       }

//       const peerConnection = new RTCPeerConnection({
//         iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
//       });

//       peerConnection.ontrack = (event) => {
//         setRemoteStream(event.streams[0]);
//         if (remoteVideoRef.current) {
//           remoteVideoRef.current.srcObject = event.streams[0];
//         }
//       };

//       peerConnection.onicecandidate = (event) => {
//         if (event.candidate) {
//           socket.emit('candidate', { roomId, candidate: event.candidate });
//         }
//       };

//       localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

//       const offer = await peerConnection.createOffer();
//       await peerConnection.setLocalDescription(offer);
//       socket.emit('offer', { roomId, offer });

//       setPeerConnection(peerConnection);
//       setCallInProgress(true);

//       const startTime = Date.now();
//       timerInterval.current = setInterval(() => {
//         const elapsed = Date.now() - startTime;
//         const minutes = Math.floor(elapsed / 60000);
//         const seconds = Math.floor((elapsed % 60000) / 1000);
//         setCallDuration(
//           `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
//         );
//       }, 1000);
//     } catch (error) {
//       console.error('Error starting call:', error);
//     }
//   };

//   const endCall = () => {
//     if (peerConnection) {
//       peerConnection.close();
//       setPeerConnection(null);
//     }

//     if (localStream) {
//       localStream.getTracks().forEach((track) => track.stop());
//       setLocalStream(null);
//     }

//     if (remoteStream) {
//       setRemoteStream(null);
//     }

//     setCallInProgress(false);

//     if (timerInterval.current) {
//       clearInterval(timerInterval.current);
//       timerInterval.current = null;
//     }

//     setCallDuration('00:00');
//   };

//   const handleOffer = async (offer) => {
//     const peerConnection = new RTCPeerConnection({
//       iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
//     });

//     peerConnection.ontrack = (event) => {
//       setRemoteStream(event.streams[0]);
//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = event.streams[0];
//       }
//     };

//     peerConnection.onicecandidate = (event) => {
//       if (event.candidate) {
//         socket.emit('candidate', { roomId, candidate: event.candidate });
//       }
//     };

//     localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

//     await peerConnection.setRemoteDescription(offer);
//     const answer = await peerConnection.createAnswer();
//     await peerConnection.setLocalDescription(answer);
//     socket.emit('answer', { roomId, answer });

//     setPeerConnection(peerConnection);
//   };

//   const handleAnswer = async (answer) => {
//     await peerConnection.setRemoteDescription(answer);
//   };

//   const handleCandidate = async (candidate) => {
//     try {
//       await peerConnection.addIceCandidate(candidate);
//     } catch (e) {
//       console.error('Error adding received ICE candidate', e);
//     }
//   };

//   return (
//     <div className="app-container">
//       <h1 className="app-header">Video Call App</h1>
//       <div className="auth-section">
//         <input
//           type="email"
//           className="auth-input"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//         />
//         <input
//           type="password"
//           className="auth-input"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//         />
//         <button className="auth-button" onClick={handleSignup}>
//           Sign Up
//         </button>
//         <button className="auth-button" onClick={handleLogin}>
//           Login
//         </button>
//       </div>

//       {userId && (
//         <div className="users-section">
//           <button className="load-users" onClick={loadUsers}>
//             Load Users
//           </button>
//           <div className="user-cards-container">
//             {users.map((user) => (
//               <div key={user._id} className="user-card">
//                 <h3>{user.email}</h3>
//                 <button onClick={() => sendRequest(user._id)}>Send Request</button>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       <div className="room-section">
//         <input
//           type="text"
//           className="room-input"
//           placeholder="Room ID"
//           value={roomId}
//           onChange={(e) => setRoomId(e.target.value)}
//         />
//         <button className="join-room" onClick={joinRoom}>
//           Join Room
//         </button>
//       </div>

//       {callInProgress && <div className="call-timer">Call Duration: {callDuration}</div>}

//       <button
//         className={callInProgress ? 'end-call-button' : 'call-button'}
//         onClick={callInProgress ? endCall : startCall}
//       >
//         {callInProgress ? 'End Call' : 'Start Call'}
//       </button>

//       <div className="video-container">
//         {localStream && <video ref={localVideoRef} className="local-video" autoPlay playsInline muted />}
//         {remoteStream && <video ref={remoteVideoRef} className="remote-video" autoPlay playsInline />}
//       </div>
//     </div>
//   );
// };

// export default App;

