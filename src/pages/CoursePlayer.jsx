import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, increment, arrayUnion, onSnapshot, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from 'framer-motion';
import {  
  Play, CheckCircle, ChevronRight, List, Save, Mic, Square,
  Award, Lock, FileText, Download, Zap, Monitor, Clock, 
  MessageCircle, SkipForward, Volume2, Trash2
} from 'lucide-react';

import './CoursePlayer.css';

const CoursePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // States
  const [courseData, setCourseData] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [note, setNote] = useState("");
  const [notif, setNotif] = useState({ show: false, msg: "", type: "info" });
  
  // Voice Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  // 1. نظام الحماية المتقدم (Security)
  useEffect(() => {
    const preventActions = (e) => {
      if (e.type === 'contextmenu') e.preventDefault();
      if (e.ctrlKey && ['p', 's', 'u', 'c'].includes(e.key)) e.preventDefault();
      if (e.key === 'F12') e.preventDefault();
    };
    document.addEventListener('contextmenu', preventActions);
    document.addEventListener('keydown', preventActions);
    return () => {
      document.removeEventListener('contextmenu', preventActions);
      document.removeEventListener('keydown', preventActions);
    };
  }, []);

  // 2. جلب البيانات + الملاحظات السحابية
  useEffect(() => {
    let unsubUser = () => {};
    const fetchInitialData = async () => {
      try {
        const docRef = doc(db, "courses_metadata", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setCourseData(data);
          const lastSavedId = localStorage.getItem(`last_vid_${id}`);
          const initialLesson = data.lessons?.find(l => l.id === lastSavedId) || data.lessons?.[0];
          setCurrentLesson(initialLesson);
          
          // جلب ملاحظة الدرس من السحابة
          if (auth.currentUser && initialLesson) {
            const noteRef = doc(db, `users/${auth.currentUser.uid}/notes`, initialLesson.id);
            const noteSnap = await getDoc(noteRef);
            if (noteSnap.exists()) setNote(noteSnap.data().text);
          }
        }

        if (auth.currentUser) {
          unsubUser = onSnapshot(doc(db, "users", auth.currentUser.uid), (s) => {
            if (s.exists()) {
              setCompletedLessons(s.data().completedLessons || []);
              setUserPoints(s.data().points || 0);
            }
          });
        }
        setLoading(false);
      } catch (error) { setLoading(false); }
    };

    fetchInitialData();
    return () => unsubUser();
  }, [id]);

  // 3. محرك التسجيل الصوتي (Voice Notes)
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
    mediaRecorder.current.onstop = () => {
      const blob = new Blob(audioChunks.current, { type: 'audio/ogg; codecs=opus' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      audioChunks.current = [];
    };
    mediaRecorder.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.current.stop();
    setIsRecording(false);
    triggerNotif("تم حفظ الريكورد في المتصفح", "success");
  };

  // 4. حفظ الملاحظات للسحابة (Cloud Save)
  const handleSaveNote = async () => {
    if (!auth.currentUser || !currentLesson) return;
    try {
      const noteRef = doc(db, `users/${auth.currentUser.uid}/notes`, currentLesson.id);
      await setDoc(noteRef, {
        text: note,
        updatedAt: new Date().toISOString(),
        lessonTitle: currentLesson.title
      });
      triggerNotif("تم الحفظ في سحابة حسابك ☁️", "success");
    } catch (e) { triggerNotif("خطأ في الاتصال", "error"); }
  };

  const handleLessonComplete = async () => {
    if (!auth.currentUser || completedLessons.includes(currentLesson.id)) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, {
      completedLessons: arrayUnion(currentLesson.id),
      points: increment(150) // زيادة النقاط للتحفيز
    });
    triggerNotif("بطل! +150 XP 🌟", "success");
  };

  if (loading) return <div className="player-loading"><Zap className="spin" size={40}/></div>;

  return (
    <div className="nebula-player no-select">
      {/* Dynamic Watermark - يتحرك عشوائياً */}
      <div className="moving-watermark">
        {auth.currentUser?.email} - {auth.currentUser?.uid.slice(0,5)}
      </div>

      <header className="player-header glass">
        <div className="header-right">
          <button onClick={() => navigate(-1)} className="back-btn"><ChevronRight/></button>
          <div className="title-area">
            <h3>{courseData?.title}</h3>
            <p>{currentLesson?.title}</p>
          </div>
        </div>
        <div className="header-left">
           <div className="xp-badge"><Award size={16}/> {userPoints} XP</div>
           <button className="sos-btn" onClick={() => window.open('https://wa.me/YOUR_NUMBER', '_blank')}>
             <MessageCircle size={18}/> مساعدة
           </button>
        </div>
      </header>

      <div className="player-main">
        <div className={`video-section ${!isSidebarOpen ? 'full-width' : ''}`}>
          <div className="iframe-wrapper glass">
            <iframe 
               src={`https://www.youtube.com/embed/${currentLesson?.videoUrl?.split('v=')[1] || currentLesson?.videoUrl?.split('/').pop()}?rel=0&modestbranding=1`}
               title="video" allowFullScreen
            ></iframe>
          </div>

          <div className="control-shelf glass">
             <div className="lesson-desc">
               <h2>{currentLesson?.title}</h2>
               <div className="tags">
                 <span className="tag"><Clock size={12}/> {currentLesson?.duration || '15:00'}</span>
                 <span className="tag"><Zap size={12}/> مادة علمية</span>
               </div>
             </div>
             <div className="actions">
                {currentLesson?.pdfUrl && (
                  <button className="download-btn" onClick={() => window.open(currentLesson.pdfUrl)}><Download size={18}/> المذكرة</button>
                )}
                <button 
                  className={`complete-btn ${completedLessons.includes(currentLesson?.id) ? 'done' : ''}`}
                  onClick={handleLessonComplete}
                >
                  {completedLessons.includes(currentLesson?.id) ? <CheckCircle/> : <Play/>}
                  {completedLessons.includes(currentLesson?.id) ? 'تم الإنجاز' : 'أنهيت الدرس'}
                </button>
             </div>
          </div>

          {/* قسم الملاحظات المتطور */}
          <div className="notes-area glass">
             <div className="notes-tabs">
                <button className="active"><FileText size={16}/> ملاحظات مكتوبة</button>
                <button onClick={() => triggerNotif("سجل ملاحظتك الصوتية بالأسفل", "info")}><Mic size={16}/> ملاحظات صوتية</button>
             </div>
             <textarea 
               placeholder="اكتب أهم النقاط في هذه المحاضرة..."
               value={note}
               onChange={(e) => setNote(e.target.value)}
             ></textarea>
             
             <div className="notes-footer">
                <div className="voice-controls">
                   {!isRecording ? (
                     <button className="mic-btn" onClick={startRecording}><Mic size={18}/></button>
                   ) : (
                     <button className="stop-btn" onClick={stopRecording}><Square size={18}/></button>
                   )}
                   {audioUrl && <audio src={audioUrl} controls className="mini-audio" />}
                </div>
                <button className="save-note-btn" onClick={handleSaveNote}><Save size={16}/> حفظ السحابة</button>
             </div>
          </div>
        </div>

        {/* قائمة الدروس الجانبية */}
        <aside className={`playlist-aside ${!isSidebarOpen ? 'closed' : ''}`}>
           <div className="aside-head" onClick={() => setSidebarOpen(!isSidebarOpen)}>
             <List size={20}/> محتوى الدورة
           </div>
           <div className="lessons-list">
             {courseData?.lessons?.map((les, idx) => (
               <div 
                 key={les.id} 
                 className={`les-item ${currentLesson?.id === les.id ? 'active' : ''} ${completedLessons.includes(les.id) ? 'checked' : ''}`}
                 onClick={() => setCurrentLesson(les)}
               >
                 <div className="num">{completedLessons.includes(les.id) ? <CheckCircle size={16}/> : idx + 1}</div>
                 <div className="info">
                   <h4>{les.title}</h4>
                   <span>{les.duration || '10:00'}</span>
                 </div>
                 {currentLesson?.id === les.id && <div className="playing-bar"></div>}
               </div>
             ))}
           </div>
        </aside>
      </div>
      
      {/* Toast Notif */}
      <AnimatePresence>
        {notif.show && (
          <motion.div initial={{y: 50}} animate={{y: 0}} exit={{y: 50}} className={`toast ${notif.type}`}>
            {notif.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoursePlayer;
