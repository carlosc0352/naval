import React, { useState, useEffect, useRef } from 'react';
import './Batallanaval.css';

interface Casilla {
  tipo: 'agua' | 'barco';
  disparado: boolean;
  barcoId: number | null;
}

const TAMANO = 6;
const FILAS_LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];
const TAMANOS_BARCOS = [5, 4, 3];

export default function BatallaNaval() {
  const [tableroP1, setTableroP1] = useState<Casilla[][]>([]);
  const [tableroP2, setTableroP2] = useState<Casilla[][]>([]);
  
  const [fase, setFase] = useState<'reglas' | 'posicionamiento' | 'juego' | 'ganador'>('reglas'); 
  const [jugadorActual, setJugadorActual] = useState<1 | 2>(1); 
  const [barcoActualIndex, setBarcoActualIndex] = useState<number>(0); 
  const [orientacion, setOrientacion] = useState<'H' | 'V'>('H'); 
  const [tiempoRegresivo, setTiempoRegresivo] = useState<number>(30);
  const [mensaje, setMensaje] = useState<string>('Jugador 1: Coloca tu barco de tamaño 5');
  const [ganador, setGanador] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const crearTableroVacio = (): Casilla[][] => 
      Array(TAMANO).fill(null).map(() => 
        Array(TAMANO).fill({ tipo: 'agua', disparado: false, barcoId: null })
      );
    setTableroP1(crearTableroVacio());
    setTableroP2(crearTableroVacio());
  }, []);

  useEffect(() => {
    if (fase !== 'juego') return;

    setTiempoRegresivo(30);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTiempoRegresivo((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          const siguienteJugador = jugadorActual === 1 ? 2 : 1;
          setMensaje(`⏰ ¡Se acabó el tiempo! Turno para el Jugador ${siguienteJugador}`);
          setJugadorActual(siguienteJugador);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [jugadorActual, fase]);

  const validarColocacion = (tablero: Casilla[][], fila: number, col: number, tamano: number, ori: 'H' | 'V'): boolean => {
    for (let i = 0; i < tamano; i++) {
      let r = fila + (ori === 'V' ? i : 0);
      let c = col + (ori === 'H' ? i : 0);

      if (r >= TAMANO || c >= TAMANO) return false; 
      if (tablero[r][c].tipo === 'barco') return false; 
    }
    return true;
  };

  const colocarBarco = (fila: number, col: number) => {
    const esP1 = jugadorActual === 1;
    const tablero = esP1 ? tableroP1 : tableroP2;
    const tamano = TAMANOS_BARCOS[barcoActualIndex];

    if (!validarColocacion(tablero, fila, col, tamano, orientacion)) {
      setMensaje('❌ Posición inválida o chocas con otro barco. Intenta de nuevo.');
      return;
    }

    const nuevoTablero = tablero.map(f => f.map(c => ({ ...c })));
    for (let i = 0; i < tamano; i++) {
      let r = fila + (orientacion === 'V' ? i : 0);
      let c = col + (orientacion === 'H' ? i : 0);
      nuevoTablero[r][c] = { tipo: 'barco', disparado: false, barcoId: tamano };
    }

    if (esP1) setTableroP1(nuevoTablero); else setTableroP2(nuevoTablero);

    if (barcoActualIndex < TAMANOS_BARCOS.length - 1) {
      const siguienteIndex = barcoActualIndex + 1;
      setBarcoActualIndex(siguienteIndex);
      setMensaje(`Jugador ${jugadorActual}: Coloca tu barco de tamaño ${TAMANOS_BARCOS[siguienteIndex]}`);
    } else if (jugadorActual === 1) {
      setJugadorActual(2);
      setBarcoActualIndex(0);
      setMensaje('Jugador 2: Coloca tu barco de tamaño 5');
    } else {
      setFase('juego');
      setJugadorActual(1);
      setMensaje('🔥 ¡Que empiece la batalla! Turno del Jugador 1');
    }
  };

  const realizarDisparo = (fila: number, col: number) => {
    const esP1 = jugadorActual === 1;
    const tableroEnemigo = esP1 ? tableroP2 : tableroP1;

    if (tableroEnemigo[fila][col].disparado) return; 

    const nuevoTablero = tableroEnemigo.map(f => f.map(c => ({ ...c })));
    const casilla = nuevoTablero[fila][col];
    casilla.disparado = true;

    let acierto = false;
    const coordLetra = FILAS_LETRAS[fila];
    const coordNum = col + 1;

    if (esP1) setTableroP2(nuevoTablero); else setTableroP1(nuevoTablero);

    if (casilla.tipo === 'barco') {
      acierto = true;
      const idBarco = casilla.barcoId;

      const barcoHundidoPorCompleto = !nuevoTablero.some(f => 
        f.some(c => c.barcoId === idBarco && !c.disparado)
      );

      if (barcoHundidoPorCompleto) {
        if (timerRef.current) clearInterval(timerRef.current);
        setGanador(jugadorActual);
        setFase('ganador');
        setMensaje(`🏆 ¡VICTORIA! El Jugador ${jugadorActual} completó y hundió el barco de tamaño ${idBarco}. ¡Gana la partida!`);
        return;
      } else {
        setMensaje(`💥 ¡IMPACTO en ${coordLetra}${coordNum}! Barco de tamaño ${idBarco} dañado. ¡Jugador ${jugadorActual} repite turno!`);
      }
    } else {
      setMensaje(`💧 Agua en ${coordLetra}${coordNum}. Turno del Jugador ${jugadorActual === 1 ? 2 : 1}`);
    }

    if (!acierto) {
      setJugadorActual(jugadorActual === 1 ? 2 : 1);
    }
  };

  if (fase === 'reglas') {
    return (
      <div className="batalla-naval-container">
        <div className="tarjeta-reglas">
          <h2>⚓ REQUERIMIENTOS DEL JUEGO ⚓</h2>
          <ul className="lista-requerimientos">
            <li><strong>Tablero:</strong> Cuadrícula de 6x6 (36 casillas en total).</li>
            <li><strong>Coordenadas:</strong> Columnas con números (1-6) y Filas con letras (A-F).</li>
            <li><strong>Flota:</strong> 3 Barcos de tamaños: 5, 4 y 3 casillas.</li>
            <li><strong>Modalidad:</strong> Dos jugadores en la misma pantalla (1vs1 local).</li>
          </ul>

          <h2>📜 REGLAS DE COMBATE</h2>
          <ol className="lista-reglas">
            <li><strong>Posicionamiento:</strong> Los barcos se ubican de manera horizontal o vertical. No pueden encimarse.</li>
            <li><strong>Condición de Victoria:</strong> Gana el jugador que logre impactar y <strong>completar todas las casillas de un barco</strong> enemigo.</li>
            <li><strong>Segunda Oportunidad:</strong> Si aciertas un impacto, tienes derecho a repetir tiro.</li>
            <li><strong>Tiempo Límite:</strong> Cuentas con <strong>30 segundos para atacar</strong> o perderás tu turno.</li>
          </ol>

          <button className="btn-comenzar" onClick={() => setFase('posicionamiento')}>
            ¡Entendido, Capitán! Comenzar Juego
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="batalla-naval-container">
      <h1>⚓ Batalla Naval 1vs1 (6x6) ⚓</h1>
      
      <div className="consola-mensajes">
        <p className="mensaje-texto">{mensaje}</p>
        {fase === 'juego' && <div className="timer">⏱️ Tiempo restante: {tiempoRegresivo}s</div>}
      </div>

      {fase === 'posicionamiento' && (
        <div className="controles-posicion">
          <button onClick={() => setOrientacion(orientacion === 'H' ? 'V' : 'H')}>
            🔄 Orientación: {orientacion === 'H' ? 'Horizontal' : 'Vertical'}
          </button>
        </div>
      )}

      {fase === 'ganador' && (
        <button className="btn-reiniciar" onClick={() => window.location.reload()}>Jugar de nuevo</button>
      )}

      <div className="pantalla-tableros">
        {/* Tablero Jugador 1 */}
        <div className={`tablero-wrapper ${jugadorActual === 1 ? 'activo' : 'inactivo'}`}>
          <h3>Jugador 1</h3>
          <div className="grid-naval">
            <div className="esquina"></div>
            {Array(TAMANO).fill(null).map((_, i) => <div key={i} className="indice-num">{i + 1}</div>)}
            
            {tableroP1.map((fila, i) => (
              <React.Fragment key={i}>
                <div className="indice-letra">{FILAS_LETRAS[i]}</div>
                {fila.map((casilla, j) => {
                  let clase = "celda";
                  if (fase === 'posicionamiento' && jugadorActual === 1 && casilla.tipo === 'barco') clase += " barco-visible";
                  if (casilla.disparado) clase += casilla.tipo === 'barco' ? " celda-impacto" : " celda-agua";

                  return (
                    <button 
                      key={j} 
                      className={clase}
                      onClick={() => fase === 'posicionamiento' && jugadorActual === 1 ? colocarBarco(i, j) : fase === 'juego' && jugadorActual === 2 && realizarDisparo(i, j)}
                      disabled={fase === 'juego' && jugadorActual === 1}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Tablero Jugador 2 */}
        <div className={`tablero-wrapper ${jugadorActual === 2 ? 'activo' : 'inactivo'}`}>
          <h3>Jugador 2</h3>
          <div className="grid-naval">
            <div className="esquina"></div>
            {Array(TAMANO).fill(null).map((_, i) => <div key={i} className="indice-num">{i + 1}</div>)}
            
            {tableroP2.map((fila, i) => (
              <React.Fragment key={i}>
                <div className="indice-letra">{FILAS_LETRAS[i]}</div>
                {fila.map((casilla, j) => {
                  let clase = "celda";
                  if (fase === 'posicionamiento' && jugadorActual === 2 && casilla.tipo === 'barco') clase += " barco-visible";
                  if (casilla.disparado) clase += casilla.tipo === 'barco' ? " celda-impacto" : " celda-agua";

                  return (
                    <button 
                      key={j} 
                      className={clase}
                      onClick={() => fase === 'posicionamiento' && jugadorActual === 2 ? colocarBarco(i, j) : fase === 'juego' && jugadorActual === 1 && realizarDisparo(i, j)}
                      disabled={fase === 'juego' && jugadorActual === 2}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}