import { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { Star, MessageSquare, Plus, X, Loader2, AlertCircle, Award } from 'lucide-react';

export default function ReviewSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMsg] = useState('');

  const fetchPublicReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await ApiService.reviews.getApproved();
      if (res.success) {
        setReviews(res.data || []);
      }
    } catch (err) {
      setError('Could not synchronize customer review feeds.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicReviews();
  }, []);

  const handleReviewPublish = async (e) => {
    e.preventDefault();
    if (!authorName.trim() || !comment.trim()) {
      alert('Please fill out your name and write a brief comment.');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await ApiService.reviews.create({
        reviewer_name: authorName,
        rating: parseInt(rating),
        comment: comment
      });

      if (res.success) {
        setSuccessMsg('Review published instantly! Thank you for your feedback.');
        setAuthorName('');
        setComment('');
        setRating(5);
        fetchPublicReviews();
        setTimeout(() => {
          setSuccessMsg('');
          setModalOpen(false);
        }, 2000);
      }
    } catch (err) {
      alert(err.message || 'Failed to authorize review submission.');
    } finally {
      setSubmitLoading(false);
    }
  };
  return (
    <div className="mt-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-5 gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-medical-500" />
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">Practitioner Feedback</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium">Verified reviews from verified medical students and healthcare professionals.</p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="bg-medical-500 hover:bg-medical-600 text-white font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-sm cursor-pointer transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Write a Review</span>
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center py-12"><Loader2 className="h-6 w-6 text-medical-500 animate-spin" /></div>
      ) : error ? (
        <p className="text-xs text-red-500 py-6 text-center font-semibold">{error}</p>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-slate-400 space-y-1 font-medium">
          <MessageSquare className="h-10 w-10 mx-auto text-slate-200 dark:text-slate-700" />
          <p className="text-sm">No reviews added yet. Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          {reviews.map((rev) => (
            <div key={rev.id} className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700 p-5 rounded-2xl space-y-2.5 shadow-sm transition-transform duration-300 hover:scale-[1.01]">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm uppercase">{rev.reviewer_name}</h4>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">{rev.title_or_role || 'Medical Professional'}</span>
                </div>
                <div className="flex items-center space-x-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">"{rev.comment}"</p>
            </div>
          ))}
        </div>
      )}
      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setModalOpen(false)} />
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xl relative z-10 space-y-5 animate-scale">

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h4 className="font-black text-slate-800 dark:text-white uppercase text-sm tracking-wider">Share Your Experience</h4>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            {successMessage && <div className="bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-500 p-3 rounded text-xs text-emerald-700 dark:text-emerald-400 font-semibold">{successMessage}</div>}

            <form onSubmit={handleReviewPublish} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-400 dark:text-slate-500">Your Professional Name</label>
                <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="e.g. Dr. Abubakar" className="w-full bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-medical-500" />
              </div>

              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-400 dark:text-slate-500">Score Rating</label>
                <select value={rating} onChange={(e) => setRating(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-slate-100 font-bold uppercase focus:outline-none focus:border-medical-500">
                  <option value="5">⭐⭐⭐⭐&nbsp;5 Stars (Excellent Quality)</option>
                  <option value="4">⭐⭐⭐⭐&nbsp;4 Stars (Very Good Fit)</option>
                  <option value="3">⭐⭐⭐&nbsp;3 Stars (Standard Performance)</option>
                  <option value="2">⭐⭐&nbsp;2 Stars (Fair)</option>
                  <option value="1">⭐&nbsp;1 Star (Needs Improvement)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-400 dark:text-slate-500">Your Feedback Comment</label>
                <textarea rows="3" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write your assessment about cloth breathability, text material depth, or stethoscope audio delivery parameters..." className="w-full bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-medical-500 resize-none font-medium" />
              </div>

              <button type="submit" disabled={submitLoading} className="w-full bg-medical-500 hover:bg-medical-600 text-white font-black uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-sm cursor-pointer disabled:bg-slate-300">
                {submitLoading ? 'Publishing Review...' : 'Publish Feedback Review'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
