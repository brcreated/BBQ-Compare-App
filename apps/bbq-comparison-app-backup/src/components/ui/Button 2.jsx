export default function Button({ children, onClick }) {
  return (
    <button className="ui-button" onClick={onClick}>
      {children}
    </button>
  );
}