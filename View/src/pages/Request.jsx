import "../styles/Request_module.css";
import educationalTalk from "../assets/educational_talk.webp";
import { useState } from "react";

export default function EducationalTalkRequest() {

  const [agreed, setAgreed] = useState(false);

  const handleCheckboxChange = (e) => {
    setAgreed(e.target.checked);
  };

  const openForm = () => {
    window.open(
      "https://forms.office.com/pages/responsepage.aspx?id=wF36DW8DFUaZ5JSvgi8rhIlImwsjD_VBt9FEUbX9hshUNVI0NjVRSDlVMzZUTUYwTzJMVVRSWFJJMyQlQCN0PWcu&route=shorturl",
      "_blank"
    );
  };

  return (
    <section className="request-page">
      <div className="request__header">
        <div className="request__image-wrapper">
          <img
            src={educationalTalk}
            alt="Charla educativa en escuela"
            className="request__image"
            loading="lazy"
          />
        </div>
        <div className="request__text">
          <h1>Solicitud de Charla</h1>
          <h2>Procedimiento para solicitar charlas y/o visitas de la Oficina de Mitigación de Peligros de Deslizamientos de Tierra en Puerto Rico:</h2>
          <p>
            Ofrecemos charlas y participación en ferias educativas para escuelas, agencias gubernamentales o privadas, organizaciones sociales, organizaciones sin fines de lucro, comunidades, público en general, entre otros. 
            Para solicitar, o para coordinar conferencias en su escuela o área de trabajo favor llenar el formulario en línea o vea los métodos alternos de solicitud.
          </p>
        </div>
      </div>

      <hr className="request__divider" />

      <div className="request__body">
        <h2>Reglamento para Conferencias:</h2>

        <h3>Conferencias Virtuales</h3>
        <ol>
          <li>El solicitante de la conferencia debe contar con internet y sistema de sonido.</li>
          <li>Recibirá una invitación por email para poder acceder a la conferencia.</li>
          <li>Se realizará una prueba previa al día de la conferencia.</li>
        </ol>

        <h3>Visitas a Escuelas</h3>
        <ol>
          <li>Debe llenar el formulario o enviar una carta solicitando la conferencia. La misma debe estar aprobada por el director escolar.</li>
          <li>El solicitante debe:
            <ul>
              <li>Proveer estacionamiento seguro para el recurso.</li>
              <li>Recibir al recurso y llevarlo/a al área destinada para la conferencia. En ocasiones, el recurso necesitará ayuda con los materiales educativos y el equipo.</li>
              <li>Durante la conferencia deberá de estar presente un maestro o algún encargado, pues es quien mantendrá el control de la actividad.</li>
              <li>Debe tener un salón adecuado para poder proyectar. La Oficina de Mitigación de Peligros de Deslizamientos de Tierra en Puerto Rico no provee pantalla de proyección (solo proveemos computadora, proyector y material educativo).</li>
              <li>Si el grupo o el lugar es grande, debe considerar el uso de equipo de sonido.</li>
            </ul>
          </li>
          <li>El recurso podrá ofrecer hasta un máximo de 2 conferencias por visita. Las escuelas sólo podrán solicitar conferencias una vez en el semestre.</li>
          <li>Evitar mezclar estudiantes de distintos niveles en una misma sesión (Ej. Estudiantes de Kínder con estudiantes de 5to grado).</li>
          <li>Si por alguna razón el recurso considera que su seguridad se encuentra en riesgo (condiciones del tiempo, inconvenientes o incumplimiento de las reglas) la conferencia puede ser cancelada o pospuesta.</li>
        </ol>

        <h3>Conferencias para Público en General</h3>
        <ol>
          <li>Contar con un mínimo de 10 personas.</li>
          <li>El solicitante de la conferencia debe asegurarse de proveer estacionamiento, recibir al recurso y tener un salón con el equipo adecuado para proyectar.</li>
          <li>La conferencia puede ser cancelada o pospuesta si el recurso considera que su seguridad está en riesgo (condiciones del tiempo, inconvenientes o incumplimiento de las reglas)</li>
        </ol>

        <label className="request__checkbox">
          <input 
            type="checkbox" 
            checked={agreed} 
            onChange={handleCheckboxChange} 
          />
          He leído las reglas y las acepto.
        </label>

        {agreed && (
          <div className="request__button-container">
            <button className="request__form-button" onClick={openForm}>
              Acceder Formulario
            </button>
          </div>
        )}

      </div>
    </section>
  );
}