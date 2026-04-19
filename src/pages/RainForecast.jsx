import '../styles/RainForecast_module.css';

function RainForecast() {
  return (
    <section className="rain-forecast">
      <div className="rain-forecast__content">
        <div className="rain-forecast__text">
          <h1>Pronóstico de Lluvia</h1>
          <p className="rain-forecast__note">
            <em>
              Si las imágenes no se han actualizado, actualice la página o haga clic en ellas para ver las últimas versiones.
            </em>
          </p>
          <p>
            El pronóstico de lluvia provee información através del mapa interactivo de <strong>National Weather Service</strong>, al igual que provee la precipitación esperada para hoy y mañana.
          </p>
          <p>
            La lluvia es uno de los factores principales que desencadenan deslizamientos en Puerto Rico, por lo que conocer su distribución y acumulación permite anticipar condiciones de riesgo y fortalecer la preparación.
          </p>
        </div>

        <div className="rain-forecast__map">
          <a
            href="https://radar.weather.gov/?settings=v1_eyJhZ2VuZGEiOnsiaWQiOiJsb2NhbCIsImNlbnRlciI6Wy02Ni41NzIsMTguMDU1XSwibG9jYXRpb24iOm51bGwsInpvb20iOjguMzMzMzMzMzMzMzMzMzM0LCJmaWx0ZXIiOiJXU1ItODhEIiwibGF5ZXIiOiJzcl9icmVmIiwic3RhdGlvbiI6IlRKVUEifSwiYW5pbWF0aW5nIjp0cnVlLCJiYXNlIjoic3RhbmRhcmQiLCJhcnRjYyI6ZmFsc2UsImNvdW50eSI6ZmFsc2UsImN3YSI6ZmFsc2UsInJmYyI6ZmFsc2UsInN0YXRlIjpmYWxzZSwibWVudSI6dHJ1ZSwic2hvcnRGdXNlZE9ubHkiOnRydWUsIm9wYWNpdHkiOnsiYWxlcnRzIjowLjgsImxvY2FsIjowLjYsImxvY2FsU3RhdGlvbnMiOjAuOCwibmF0aW9uYWwiOjAuNn19"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://radar.weather.gov/ridge/standard/TJUA_loop.gif"
              alt="Radar en vivo del Servicio Nacional de Meteorología de Puerto Rico"
              className="rain-forecast__map-image"
            />
          </a>
        </div>

        <div className="rain-forecast__comparison">
          <div className="rain-forecast__card">
            <h2>Pronóstico del Día</h2>
            <a
              href="https://www.weather.gov/images/sju/marine/wrf/nbm24hr_prec.png"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://www.weather.gov/images/sju/marine/wrf/nbm24hr_prec.png"
                alt="Pronóstico del día"
              />
            </a>
          </div>

          <div className="rain-forecast__card">
            <h2>Pronóstico de Mañana</h2>
            <a
              href="https://www.weather.gov/images/sju/marine/wrf/nbm48hr_prec.png"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://www.weather.gov/images/sju/marine/wrf/nbm48hr_prec.png"
                alt="Pronóstico de mañana"
              />
            </a>
          </div>
        </div>
      </div> 
    </section>
  );
}

export default RainForecast;
