import Swal from 'sweetalert2'

export async function withLoading<T>(promise: Promise<T>, opts: { loading: string; success?: string; error?: string }): Promise<T> {
  Swal.fire({
    title: opts.loading,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading(),
  })
  try {
    const result = await promise
    Swal.close()
    if (opts.success) {
      Swal.fire({ icon: 'success', title: opts.success, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' })
    }
    return result
  } catch (e: any) {
    Swal.close()
    Swal.fire({ icon: 'error', title: opts.error ?? 'Error', text: e?.message || 'Intentalo de nuevo', confirmButtonColor: '#d33' })
    throw e
  }
}
