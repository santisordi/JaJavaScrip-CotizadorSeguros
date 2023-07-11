async function obtenerDatos() {
    const response = await fetch('data.json');
    const data = await response.json();

    const autos = data.autos;
    const cobertura = data.cobertura;
    const coberturas = buscarCobertura(cobertura)

    const marcas = buscarMarcas(autos)

    let autoSeleccionado
    let costoCoberturaSeleccionada

    const DateTime = luxon.DateTime
    const dt = DateTime.now();
    const fecha = dt.toLocaleString(DateTime.DATE_HUGE);

    // Funcion para mostarar las datos guardados en el storage 
    function mostrarDatosGuardados() {
        let cotizacionLocal = JSON.parse(localStorage.getItem('cotizacion'));
        if (cotizacionLocal) {
            const marca = cotizacionLocal.marca ? cotizacionLocal.marca : 'sin marca';
            const modelo = cotizacionLocal.modelo ? cotizacionLocal.modelo : 'sin modelo';
            const precio = cotizacionLocal.precio ? cotizacionLocal.precio : 'sin precio';

            autoSeleccionado = cotizacionLocal;
            Swal.fire({
                title: 'Inicia el programa',
                html: `Sus datos guardados son:<br>Marca: ${marca}<br>Modelo: ${modelo}<br>precio: $${precio}`,
                icon: 'success',
                confirmButtonText: 'Ok'
            });
        }
    }

    function buscarCobertura() {
        const coberturasABuscar = []
        for (cob of cobertura) {
            if (!coberturasABuscar.includes(cob.tipo)) {
                coberturasABuscar.push(cob.tipo)
            }
        }
        return coberturasABuscar
    }

    function buscarMarcas(autos) {
        const marcasABuscar = []
        for (autos of autos) {
            if (!marcasABuscar.includes(autos.marca)) {
                marcasABuscar.push(autos.marca)
            }
        }
        return marcasABuscar
    }

    function crearSelect(tipoSelect, contenedor, array, idSelect) {
        let select = document.createElement('select')
        select.innerHTML = `
<option value="">Seleccione ${tipoSelect}</option>
${
    array.map((element)=>{
        return(
            `<option value="${element}">${element}</option>`
        )
    })
}
`
        select.setAttribute('id', idSelect)
        contenedor.append(select)
        select.addEventListener('change', elegirCobertura);
    }

    function eventoElegirMarca() {
        const selectMarca = document.getElementById('selectMarca')
        selectMarca.addEventListener('change', elegirAuto)
    }
    //esta es la funcion manejadora
    const elegirAuto = (e) => {
        const marcaSeleccionada = e.target.value;
        const autoConModelo = autos.filter((auto) => auto.marca === marcaSeleccionada);
        const modelos = autoConModelo.map((auto) => auto.modelo);
        let selectModelo = document.getElementById('selectModelo');
        selectModelo
            ?
            selectModelo.innerHTML = `
                <option value="">Seleccione el modelo</option>
                ${modelos.map((modelo) => `<option value=${modelo}>${modelo}</option>`)}
            ` :
            crearSelect('el modelo', contendorModelo, modelos, 'selectModelo');
        eventoElegirModelo();
    }
    // esta funcion es para cuando selecciona el modelo 
    function eventoElegirModelo() {
        const selectModelo = document.getElementById('selectModelo')
        selectModelo.addEventListener('change', elegirModelo)
    }

    function elegirModelo(e) {
        const modeloSeleccionado = e.target.value
        autoSeleccionado = autos.find((auto) => auto.modelo === modeloSeleccionado)
    }

    function enviarCotizacion() {
        let botonCalcular = document.getElementById('enviar-cotizacion')
        botonCalcular.addEventListener('click', mostrarPrecio)
    }

    function mostrarPrecio() {
        if (autoSeleccionado) {
            const edad = parseInt(document.getElementById('edad').value);
            if (!edad) {
                Swal.fire({
                    title: 'Error!',
                    text: 'Por favor ingrese la edad del tomador',
                    icon: 'error',
                    confirmButtonText: 'Ok'
                })
                return;
            }
            const anio = parseInt(document.getElementById('anio').value);
            if (!anio) {
                Swal.fire({
                    title: 'Error!',
                    text: 'Por favor ingrese el año de la unidad',
                    icon: 'error',
                    confirmButtonText: 'Ok'
                })
                return;
            }
            const costoEdad = costoPorEdad(edad);
            if (!costoEdad) {
                Swal.fire({
                    title: 'Error!',
                    text: 'Ingrese una edad entre los 18 y 70 años',
                    icon: 'error',
                    confirmButtonText: 'Ok'
                })
                return;
            }
            const costoAnio = costoPorAnio(anio);
            if (!costoAnio) {
                Swal.fire({
                    title: 'Error!',
                    text: 'Año de la unidad fuera de politicas de subscripcion',
                    icon: 'error',
                    confirmButtonText: 'Ok'
                })
                return;
            }
            const plusCobertura = costoCoberturaSeleccionada ? costoCoberturaSeleccionada.precioAdicional : 0
            if (!plusCobertura) {
                Swal.fire({
                    title: 'Error!',
                    text: 'Por favor seleccione el tipo de cobertura',
                    icon: 'error',
                    confirmButtonText: 'Ok'
                })
                return;
            }
            const precioTotal = autoSeleccionado.precio + costoEdad + costoAnio + plusCobertura;
            let coberturaGuardada = {
                ...autoSeleccionado,
                precio: precioTotal
            }
            localStorage.setItem('cotizacion', JSON.stringify(coberturaGuardada))

            let contenedorCotizacion = document.getElementById('cotizacion');
            let cotizacion = document.getElementById('resultado-cotizacion');
            if (!cotizacion) {
                cotizacion = document.createElement('div');
                cotizacion.setAttribute('id', 'resultado-cotizacion');
                contenedorCotizacion.append(cotizacion);
            }
            //muestra el sweet de confirmacion y el resultado con la fecha de la cotizacion 
            Swal.fire({
                title: 'Está seguro que desea continuar?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, seguro',
                cancelButtonText: 'No, no quiero'
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: '¡Cotizacion enviada!',
                        icon: 'success',
                        text: `
                El precio de su cotización para la unidad ${autoSeleccionado.marca} ${autoSeleccionado.modelo} es de $ ${precioTotal}.`,
                        footer: fecha
                    })
                    //resetea formulario
                    document.getElementById("formulario").reset();
                }
            })
        } else {
            Swal.fire({
                title: 'Error!',
                text: 'Debe seleccionar la Marca y el modelo',
                icon: 'error',
                confirmButtonText: 'Ok'
            })
        }
    }
    // Función para agregar el costo por edad del conductor
    const costoPorEdad = (edad) => {
        return edad >= 18 && edad <= 25 ? 2500 :
            edad >= 26 && edad <= 35 ? 2000 :
            edad >= 36 && edad <= 50 ? 1500 :
            edad >= 51 && edad <= 70 ? 1000 :
            false;
    }
    // Función para agregar el costo por el año del auto
    // 
    function costoPorAnio(anio) {
        console.log(anio)
        const anioActual = new Date().getFullYear();
        console.log(anioActual)
        if (anio >= anioActual) {
            return true;
        } else if (anio < 1993) {
            return false;
        } else {
            return (anioActual - anio) / 5 * 500;
        }
    }

    function eventoTipoCobertura() {
        const tipoCobertura = document.getElementById('tipoDeCobertura')
        tipoCobertura.addEventListener('change', elegirCobertura)
    }

    function elegirCobertura(e) {
        const coberturaSeleccionada = e.target.value;
        costoCoberturaSeleccionada = cobertura.find((cob) => cob.tipo === coberturaSeleccionada);
    }

    let contenedorMarca = document.getElementById('marca')
    let contendorModelo = document.getElementById('marcaModelo')
    let contenedorCobertura = document.getElementById('contenedorCobertura')

    crearSelect('la marca', contenedorMarca, marcas, 'selectMarca')
    crearSelect('Tipo de cobertura', contenedorCobertura, coberturas, 'tipoDeCobertura')

    eventoElegirMarca()
    enviarCotizacion()
    eventoTipoCobertura()
    mostrarDatosGuardados()
}

obtenerDatos()