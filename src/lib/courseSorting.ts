export const categoryOrder: Record<string, number> = {
  'Curso': 1,
  'Taller': 2,
  'Retiro': 3,
  'Iniciacion': 4,
  'Activacion': 5
}

export const getFirstInstanceDate = (course: any) => {
  if (!course.instances || course.instances.length === 0) return Infinity
  // instances are sorted by startDate desc, so the last one is the oldest (first instance)
  const oldest = course.instances[course.instances.length - 1]
  return new Date(oldest.startDate).getTime()
}

export const sortCoursesByAdminPriority = (courses: any[]) => {
  return [...courses].sort((a, b) => {
    const orderA = categoryOrder[a.type] || 99
    const orderB = categoryOrder[b.type] || 99
    if (orderA !== orderB) return orderA - orderB

    return getFirstInstanceDate(a) - getFirstInstanceDate(b)
  })
}
