export default function Button({
  onClick, icon, text, disabled, className, id, style,
}: any) {
  return (
        <button
            id={id}
            className={`button-control ${className}`}
            onClick={onClick}
            disabled={disabled}
            style={style}
        >
            <div className="buttonIcon">
                {icon}
            </div>
            <div className="buttonText">
                {text}
            </div>
        </button>
  );
}
