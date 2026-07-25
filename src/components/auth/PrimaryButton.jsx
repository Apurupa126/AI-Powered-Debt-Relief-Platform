export default function PrimaryButton({ text }) {
  return (
    <button
      type="submit"
      className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-semibold transition duration-300"
    >
      {text}
    </button>
  );
}