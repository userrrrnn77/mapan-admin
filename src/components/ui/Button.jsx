export const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`btn btn-${variant}`}
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
      {loading ? 'Sabar Bre...' : children}
    </button>
  );
};
