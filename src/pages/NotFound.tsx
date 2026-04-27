import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold text-gray-800">Page not found</h1>
      <Link to="/" className="text-[var(--gummy-color,#FF6B9D)] font-semibold underline">
        Go home
      </Link>
    </div>
  );
}
