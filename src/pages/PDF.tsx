import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSchedule } from '../api/client';
import PDFPreview, { type Schedule } from './PDFPreview';

export default function PDF() {
  const { id } = useParams();
  const [schedule, setSchedule] = useState<Schedule | null>(null);

  useEffect(() => {
    getSchedule(Number(id)).then(setSchedule);
  }, [id]);

  if (!schedule) return <div className="p-6">Loading...</div>;
  return <PDFPreview schedule={schedule} />;
}
