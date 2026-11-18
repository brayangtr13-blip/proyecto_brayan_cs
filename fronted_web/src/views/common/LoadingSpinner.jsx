// src/views/common/LoadingSpinner.jsx
const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-t2">
      {/* Círculo que gira: borde azul con un lado transparente */}
      <div className="size-10 animate-spin rounded-full border-4 border-borde border-t-acc"></div>
      <p>Cargando...</p>
    </div>
  )
}

export default LoadingSpinner
