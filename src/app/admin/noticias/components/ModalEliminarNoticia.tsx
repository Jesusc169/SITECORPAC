"use client";

export default function ModalEliminarNoticia({
  noticia,
  onClose,
  onSuccess,
}: any) {
  const handleDelete = async () => {
    await fetch(`/api/administrador/noticias/${noticia.id}`, {
      method: "DELETE",
    });

    onSuccess();
    onClose();
  };

  return (
    <>
      {/* BACKDROP */}
      <div
        className="modal-backdrop show"
        onClick={onClose}
      />

      {/* MODAL */}
      <div
        className="modal show d-block"
        role="dialog"
        aria-modal="true"
      >
        <div
          className="modal-dialog"
          onClick={(e) => e.stopPropagation()} // evita cerrar al clickear dentro
        >
          <div className="modal-content">
            {/* HEADER */}
            <div className="modal-header">
              <h5 className="modal-title">Eliminar noticia</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Cerrar"
                onClick={onClose}
              />
            </div>

            {/* BODY */}
            <div className="modal-body">
              ¿Seguro que deseas eliminar{" "}
              <strong>{noticia.titulo}</strong>?
            </div>

            {/* FOOTER */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
