import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordComplexityValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    if (value.length < 8) return { minlength: true };

    for (let i = 0; i < value.length - 2; i++) {
      const char1 = value.charCodeAt(i);
      const char2 = value.charCodeAt(i + 1);
      const char3 = value.charCodeAt(i + 2);

      if ((char2 === char1 + 1 && char3 === char2 + 1) ||
        (char2 === char1 - 1 && char3 === char2 - 1)) {
        return { consecutive: true };
      }
    }
    return null;
  };
}

export function minAgeValidator(minAge: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    // Convertimos la fecha del input (YYYY-MM-DD) a objeto Date
    const birthDate = new Date(control.value);
    const today = new Date();

    // Calculamos la fecha límite (Hoy hace 15 años)
    const limitDate = new Date(
      today.getFullYear() - minAge,
      today.getMonth(),
      today.getDate()
    );

    // Si la fecha de nacimiento es DESPUÉS de la fecha límite, es muy joven
    return birthDate <= limitDate ? null : { underAge: true };
  };
}