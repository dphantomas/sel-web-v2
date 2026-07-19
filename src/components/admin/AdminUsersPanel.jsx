'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { UploadCloud, User as UserIcon, Users, X, Check, Search, Eye, EyeOff, FileText, CheckCircle, Edit2, Shield, Layout, Trash2, Calendar, Link2, DollarSign, Image as ImageIcon, ChevronDown, ChevronRight } from 'lucide-react'
import Script from 'next/script'
import ImageCropperModal from '@/components/ImageCropperModal'
import GalleryAdmin from './GalleryAdmin'
import { COUNTRIES } from '@/lib/countries'

export default function AdminUsersPanel({ initialUsers, courses: initialCourses }) {
  const [activeTab, setActiveTab] = useState('users') // Hardcoded to 'users' for this panel
  const [expandedCourses, setExpandedCourses] = useState(new Set())
  
  const [users, setUsers] = useState(initialUsers || [])

  const [courses, setCourses] = useState(initialCourses || [])
  
  // Image Cropping States
  const [cropModalImage, setCropModalImage] = useState(null)
  const [croppedImageBlob, setCroppedImageBlob] = useState(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingId, setUpdatingId] = useState(null) // para loaders de accesos

  // Filtro "hizo taller A pero no taller B"
  const [filterHasCourseId, setFilterHasCourseId] = useState('')
  const [filterNotCourseId, setFilterNotCourseId] = useState('')
  
  // Estados para modales de edición/creación
  const [editingUser, setEditingUser] = useState(null)
  const [userTab, setUserTab] = useState('data') // 'data' | 'access' | 'resources'
  const [editImagePreview, setEditImagePreview] = useState(null)
  const editFileInputRef = useRef(null)

  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [newUserData, setNewUserData] = useState({ firstName: '', lastName: '', email: '', phone: '', role: 'Guest' })

  const [isCreatingCourse, setIsCreatingCourse] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [newCourseData, setNewCourseData] = useState({ title: '', slug: '', description: '', shortDescription: '', image: '', type: 'Curso', published: false })
  const [isSaving, setIsSaving] = useState(false)

  const [managingInstanceUsers, setManagingInstanceUsers] = useState(null)
  const [instanceSearchTerm, setInstanceSearchTerm] = useState('')

  // =================== LOGICA LIMPIEZA CLOUDINARY ===================
  const pendingUploadRef = useRef(null)

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (pendingUploadRef.current) {
        navigator.sendBeacon(`/api/admin/cloudinary?public_id=${pendingUploadRef.current}`)
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isCreatingCourse || editingCourse) {
          handleCancelCourseEdit()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCreatingCourse, editingCourse])

  const handleCancelCourseEdit = () => {
    if (pendingUploadRef.current) {
      fetch(`/api/admin/cloudinary?public_id=${pendingUploadRef.current}`, { method: 'DELETE' })
        .catch(err => console.error('Error limpiando cloudinary:', err))
      pendingUploadRef.current = null
    }
    setIsCreatingCourse(false)
    setEditingCourse(null)
    setNewCourseData({ title: '', slug: '', description: '', shortDescription: '', image: '', type: 'Curso', published: false })
  }

  // =================== LOGICA CLOUDINARY CURSO ===================
  const openCloudinaryCourseWidget = async (isNewCourse) => {
    try {
      setIsUploading(true)
      
      // Pedimos la carpeta autorizada y la API Key al servidor para no tener secretos (ni nombres) hardcodeados en el frontend.
      const configRes = await fetch('/api/admin/cloudinary-sign?type=course')
      const { folder, apiKey, error: configError } = await configRes.json()
      if (configError) throw new Error(configError)

      window.cloudinary.createUploadWidget(
        {
          cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          apiKey: apiKey, 
          folder: folder,
          multiple: false,
          sources: ['local', 'url', 'camera', 'dropbox', 'onedrive', 'google_drive'],
          clientAllowedFormats: ['jpg', 'png', 'jpeg', 'webp'],
          maxFileSize: 5000000,
          uploadSignature: async (callback, params_to_sign) => {
            try {
              const signRes = await fetch('/api/admin/cloudinary-sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paramsToSign: params_to_sign })
              })
              const { signature } = await signRes.json()
              callback(signature)
            } catch (err) {
              console.error('Error al firmar:', err)
            }
          }
        },
        (error, result) => {
          if (!error && result && result.event === 'success') {
            const uploadedUrl = result.info.secure_url
            pendingUploadRef.current = result.info.public_id // Guardamos public_id por si cancela
            if (isNewCourse) {
              setNewCourseData({ ...newCourseData, image: uploadedUrl })
            } else {
              setEditingCourse({ ...editingCourse, image: uploadedUrl })
            }
          }
          if (result && (result.event === 'success' || result.event === 'close')) {
            setIsUploading(false)
          }
        }
      ).open()
    } catch (err) {
      console.error(err)
      setIsUploading(false)
      alert('Error abriendo el uploader')
    }
  }

  const handleDeleteCourseImage = async (isNewCourse) => {
    const currentImage = isNewCourse ? newCourseData.image : editingCourse.image;
    if (!currentImage) return;

    if (!currentImage.includes('cloudinary.com')) {
      if (isNewCourse) setNewCourseData({ ...newCourseData, image: '' });
      else setEditingCourse({ ...editingCourse, image: '' });
      return;
    }

    if (!window.confirm('¿Seguro que deseas eliminar esta imagen de Cloudinary de forma permanente?')) return;

    try {
      setIsUploading(true);
      const url = currentImage;
      const uploadIndex = url.indexOf('/upload/');
      if (uploadIndex === -1) throw new Error('URL de Cloudinary no válida');
      
      let path = url.substring(uploadIndex + 8);
      if (path.match(/^v\d+\//)) {
        path = path.replace(/^v\d+\//, '');
      }
      const publicId = path.split('.').slice(0, -1).join('.') || path;

      const res = await fetch(`/api/admin/cloudinary?public_id=${encodeURIComponent(publicId)}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error al borrar la imagen en Cloudinary');

      if (isNewCourse) setNewCourseData({ ...newCourseData, image: '' });
      else setEditingCourse({ ...editingCourse, image: '' });
      
      alert('Imagen eliminada de Cloudinary con éxito. Recuerda guardar el curso para actualizar la base de datos.');
    } catch (error) {
      console.error(error);
      alert(error.message || 'Error al eliminar la imagen');
    } finally {
      setIsUploading(false);
    }
  }

  // Mapa instancia -> curso, para resolver accesos otorgados a nivel de instancia (fecha puntual)
  const instanceToCourseId = useMemo(() => {
    const map = new Map()
    courses.forEach((course) => {
      (course.instances || []).forEach((instance) => map.set(instance.id, course.id))
    })
    return map
  }, [courses])

  // Un usuario "hizo" un taller si tiene acceso al curso completo o a alguna de sus instancias
  const userHasCourseAccess = (user, courseId) => {
    if (!courseId) return true
    const hasDirectAccess = user.unlockedCourses?.some((uc) => uc.courseId === courseId)
    if (hasDirectAccess) return true
    return user.unlockedInstances?.some((ui) => instanceToCourseId.get(ui.courseInstanceId) === courseId) || false
  }

  const handleFilterHasCourseChange = (courseId) => {
    setFilterHasCourseId(courseId)
    if (courseId && courseId === filterNotCourseId) setFilterNotCourseId('')
  }

  const getUserResources = () => {
    if (!editingUser) return []
    const courseIds = new Set(editingUser.unlockedCourses?.map(uc => uc.courseId) || [])
    const instanceIds = new Set(editingUser.unlockedInstances?.map(ui => ui.courseInstanceId) || [])
    
    // Si tiene instancia, implícitamente tiene acceso al curso base
    editingUser.unlockedInstances?.forEach(ui => {
      const course = courses.find(c => c.instances?.some(inst => inst.id === ui.courseInstanceId))
      if (course) courseIds.add(course.id)
    })
    
    const accessibleResourcesRaw = []
    
    courses.forEach(course => {
      const hasCourse = courseIds.has(course.id)
      
      if (hasCourse && course.resources) {
        course.resources.forEach(r => {
          if (!r.courseInstanceId) {
            accessibleResourcesRaw.push({ ...r, courseTitle: course.title })
          }
        })
      }
      
      if (course.instances) {
        course.instances.forEach(inst => {
          if (instanceIds.has(inst.id) && inst.resources) {
            inst.resources.forEach(r => {
              accessibleResourcesRaw.push({ ...r, courseTitle: course.title, isInstanceExclusive: true })
            })
          }
        })
      }
    })
    
    const overriddenIds = new Set(accessibleResourcesRaw.map(r => r.overridesResourceId).filter(Boolean))
    return accessibleResourcesRaw.filter(r => !overriddenIds.has(r.id))
  }

  // =================== LOGICA RECURSOS ========================
  const [isUploading, setIsUploading] = useState(false)
  const [overrideResourceId, setOverrideResourceId] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [newResourceName, setNewResourceName] = useState('')
  const [newResourceDescription, setNewResourceDescription] = useState('')
  const [newResourceInstanceId, setNewResourceInstanceId] = useState('')
  const [previewingId, setPreviewingId] = useState(null)
  const resourceInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
      setNewResourceName(nameWithoutExt)
    }
  }

  const handleCancelFileSelect = () => {
    setSelectedFile(null)
    setNewResourceName('')
    setNewResourceDescription('')
    setNewResourceInstanceId('')
    setOverrideResourceId('')
    if (resourceInputRef.current) resourceInputRef.current.value = ''
  }

  const handleUploadResource = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      // 1. Pedir URL firmada
      const urlRes = await fetch('/api/admin/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileName: selectedFile.name, 
          fileType: selectedFile.type,
          folder: editingCourse.slug || 'varios'
        })
      })

      if (!urlRes.ok) throw new Error('Error al obtener link de subida')
      const { uploadUrl, cloudflareKey } = await urlRes.json()

      // 2. Subir archivo a R2 (S3) directamente
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': selectedFile.type },
        body: selectedFile
      })

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text()
        throw new Error(`Error de la nube (${uploadRes.status}): ${errorText.substring(0, 100)}`)
      }

      // 3. Guardar en BD
      const isDownloadable = selectedFile.type.includes('zip') || selectedFile.type.includes('rar')
      const dbRes = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newResourceName.trim() || selectedFile.name,
          description: newResourceDescription.trim() || null,
          type: selectedFile.type,
          cloudflareKey,
          isDownloadable,
          courseId: editingCourse.id,
          instanceId: newResourceInstanceId || null,
          overridesResourceId: overrideResourceId || null
        })
      })

      if (!dbRes.ok) throw new Error('Error guardando en base de datos')
      const newResource = await dbRes.json()

      // Actualizar estado
      const updatedCourse = { 
        ...editingCourse, 
        resources: [...(editingCourse.resources || []), newResource] 
      }
      setEditingCourse(updatedCourse)
      setCourses(courses.map(c => c.id === editingCourse.id ? updatedCourse : c))
      
      handleCancelFileSelect()
    } catch (error) {
      console.error(error)
      alert(error.message || 'Error en la subida.')
    } finally {
      setIsUploading(false)
    }
  }

  const handlePreviewResource = async (resource) => {
    setPreviewingId(resource.id)
    try {
      const res = await fetch(`/api/resources/${resource.id}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'No se pudo generar la preview')
      }
      const { url } = await res.json()
      window.open(url, '_blank')
    } catch (error) {
      alert(error.message)
    } finally {
      setPreviewingId(null)
    }
  }

  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este archivo? Se borrará permanentemente de la nube.')) return
    
    try {
      const res = await fetch(`/api/admin/resources?id=${resourceId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error borrando recurso')

      const updatedResources = (editingCourse.resources || []).filter(r => r.id !== resourceId)
      const updatedCourse = { ...editingCourse, resources: updatedResources }
      
      setEditingCourse(updatedCourse)
      setCourses(courses.map(c => c.id === editingCourse.id ? updatedCourse : c))
    } catch (error) {
      alert('Error al borrar el archivo.')
    }
  }

  // =================== LOGICA INSTANCIAS ===================
  const [courseTab, setCourseTab] = useState('data') // 'data' | 'instances' | 'resources'
  const [isCreatingInstance, setIsCreatingInstance] = useState(false)
  const [editingInstanceId, setEditingInstanceId] = useState(null)
  const [newInstanceData, setNewInstanceData] = useState({ startDate: '', endDate: '', location: '' })
  
  const [editingResourceId, setEditingResourceId] = useState(null)
  const [editResourceData, setEditResourceData] = useState({ name: '', overridesResourceId: '' })
  const [editSelectedFile, setEditSelectedFile] = useState(null)

  const handleCreateInstance = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/courses/${editingCourse.id}/instances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInstanceData)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error al crear instancia')
      }
      
      const data = await res.json()
      const newInstances = [data.instance, ...(editingCourse.instances || [])]
      newInstances.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
      
      const updatedCourse = { ...editingCourse, instances: newInstances }
      setEditingCourse(updatedCourse)
      setCourses(courses.map(c => c.id === editingCourse.id ? updatedCourse : c))
      
      setIsCreatingInstance(false)
      setNewInstanceData({ startDate: '', endDate: '', location: '' })
    } catch (error) {
      console.error(error)
      alert(error.message || 'Hubo un error al crear la instancia.')
    } finally {
      setIsSaving(false)
    }
  }

  const startEditInstance = (inst) => {
    setEditingInstanceId(inst.id)
    setNewInstanceData({
      startDate: new Date(inst.startDate).toISOString().split('T')[0],
      endDate: inst.endDate ? new Date(inst.endDate).toISOString().split('T')[0] : '',
      location: inst.location || ''
    })
  }

  const handleEditInstanceSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/instances/${editingInstanceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInstanceData)
      })

      if (!res.ok) throw new Error('Error al actualizar instancia')
      
      const data = await res.json()
      const updatedInstances = editingCourse.instances.map(i => i.id === editingInstanceId ? data.instance : i)
      updatedInstances.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
      
      const updatedCourse = { ...editingCourse, instances: updatedInstances }
      
      setEditingCourse(updatedCourse)
      setCourses(courses.map(c => c.id === editingCourse.id ? updatedCourse : c))
      setEditingInstanceId(null)
      setNewInstanceData({ startDate: '', endDate: '', location: '' })
    } catch (error) {
      alert(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const startEditResource = (res) => {
    setEditingResourceId(res.id)
    setEditResourceData({
      name: res.name,
      description: res.description || '',
      courseInstanceId: res.courseInstanceId || '',
      overridesResourceId: res.overridesResourceId || ''
    })
    setEditSelectedFile(null)
  }

  const handleEditResourceSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      let cloudflareKey = null
      let newType = null

      if (editSelectedFile) {
        // 1. Pedir URL firmada
        const urlRes = await fetch('/api/admin/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            fileName: editSelectedFile.name, 
            fileType: editSelectedFile.type,
            folder: editingCourse?.slug || 'varios'
          })
        })

        if (!urlRes.ok) throw new Error('Error al obtener link de subida')
        const { uploadUrl, cloudflareKey: newKey } = await urlRes.json()

        // 2. Subir archivo a R2 (S3) directamente
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': editSelectedFile.type },
          body: editSelectedFile
        })

        if (!uploadRes.ok) {
          const errorText = await uploadRes.text()
          throw new Error(`Error de la nube (${uploadRes.status}): ${errorText.substring(0, 100)}`)
        }

        cloudflareKey = newKey
        newType = editSelectedFile.type
      }

      const res = await fetch(`/api/admin/resources`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingResourceId,
          name: editResourceData.name,
          description: editResourceData.description || null,
          instanceId: editResourceData.courseInstanceId || null,
          overridesResourceId: editResourceData.overridesResourceId || null,
          cloudflareKey,
          type: newType
        })
      })

      if (!res.ok) throw new Error('Error al actualizar recurso')
      
      const updatedRes = await res.json()
      const updatedResources = editingCourse.resources.map(r => r.id === editingResourceId ? updatedRes : r)
      const updatedCourse = { ...editingCourse, resources: updatedResources }
      
      setEditingCourse(updatedCourse)
      setCourses(courses.map(c => c.id === editingCourse.id ? updatedCourse : c))
      setEditingResourceId(null)
    } catch (error) {
      alert(error.message)
    } finally {
      setIsSaving(false)
    }
  }



  const handleDeleteInstance = async (instanceId) => {
    if (!window.confirm('¿Estás seguro de que deseas ELIMINAR esta instancia?')) return
    try {
      const res = await fetch(`/api/admin/instances/${instanceId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al borrar')
      
      const updatedInstances = editingCourse.instances.filter(i => i.id !== instanceId)
      const updatedCourse = { ...editingCourse, instances: updatedInstances }
      
      setEditingCourse(updatedCourse)
      setCourses(courses.map(c => c.id === editingCourse.id ? updatedCourse : c))
    } catch (error) {
      alert('Error al eliminar la instancia.')
    }
  }

  // =================== LOGICA DE ACCESOS ===================
  const handleToggleAccess = async (userId, courseId, instanceId, isCurrentlyUnlocked) => {
    // 1. Optimistic Update (se refleja en la UI instantáneamente)
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const newU = { ...u }
        if (!isCurrentlyUnlocked) {
          newU.unlockedInstances = [...(newU.unlockedInstances || []), { courseInstanceId: instanceId }]
        } else {
          newU.unlockedInstances = (newU.unlockedInstances || []).filter(ui => ui.courseInstanceId !== instanceId)
        }
        return newU
      }
      return u
    }))

    setUpdatingId(`${userId}-${instanceId}`)
    try {
      const res = await fetch('/api/admin/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          courseId,
          instanceId,
          enabled: !isCurrentlyUnlocked
        })
      })

      if (res.ok) {
        const data = await res.json()
        const updatedUser = data.user
        
        if (updatedUser) {
          setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u))
          if (editingUser?.id === userId) {
            setEditingUser(updatedUser)
          }
        }
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Error al actualizar acceso')
        // Si falla, recargamos la página o devolvemos al estado original
        window.location.reload()
      }
    } catch (error) {
      console.error(error)
      alert('Error de conexión')
    } finally {
      setUpdatingId(null)
    }
  }

  const toggleCourseExpansion = (courseId) => {
    setExpandedCourses(prev => {
      const next = new Set(prev)
      if (next.has(courseId)) next.delete(courseId)
      else next.add(courseId)
      return next
    })
  }

  const [removeImage, setRemoveImage] = useState(false)

  const openEditUser = (user) => {
    setEditingUser(user)
    setUserTab('data')
    setEditImagePreview(user.image || null)
    setCroppedImageBlob(null)
    setRemoveImage(false)
  }

  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setCropModalImage(reader.result)
      reader.readAsDataURL(file)
    } else {
      setEditImagePreview(editingUser?.image || null)
      setCroppedImageBlob(null)
    }
    setRemoveImage(false)
  }

  const handleUserSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const formData = new FormData(e.target)
      
      if (croppedImageBlob) {
        formData.set('image', croppedImageBlob, 'profile.jpg')
      } else if (removeImage) {
        formData.set('removeImage', 'true')
      }
      
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        body: formData
      })

      if (!res.ok) throw new Error('Error al actualizar usuario')
      const data = await res.json()
      
      setUsers(users.map(u => u.id === editingUser.id ? data.user : u))
      setEditingUser(null)
    } catch (error) {
      console.error(error)
      alert('Hubo un error al guardar los datos del usuario.')
    } finally {
      setIsSaving(false)
    }
  }

  // =================== LOGICA CREACION USUARIO ===================
  const handleCreateUserSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error al crear participante')
      }

      const data = await res.json()
      setUsers([data.user, ...users])
      setIsCreatingUser(false)
      setNewUserData({ firstName: '', lastName: '', email: '', phone: '', role: 'Guest' })
    } catch (error) {
      console.error(error)
      alert(error.message || 'Hubo un error al crear el participante.')
    } finally {
      setIsSaving(false)
    }
  }

  // =================== LOGICA ELIMINACION USUARIO ===================
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`⚠️ ATENCIÓN ⚠️\n\n¿Estás seguro de que deseas ELIMINAR permanentemente a ${userName}?\n\nEsta acción borrará todo su progreso en cursos y no se puede deshacer.`)) {
      return
    }
    
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error al eliminar usuario')
      }

      setUsers(users.filter(u => u.id !== userId))
      if (editingUser?.id === userId) setEditingUser(null)
    } catch (error) {
      console.error(error)
      alert(error.message || 'Hubo un error al eliminar el usuario.')
    }
  }

  // =================== LOGICA EDICION CURSO ===================
  const handleCourseSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/courses/${editingCourse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingCourse.title,
          slug: editingCourse.slug,
          type: editingCourse.type,
          description: editingCourse.description,
          shortDescription: editingCourse.shortDescription,
          image: editingCourse.image,
          modality: editingCourse.modality,
          published: editingCourse.published
        })
      })

      if (!res.ok) throw new Error('Error al actualizar curso')
      const data = await res.json()
      
      setCourses(courses.map(c => c.id === editingCourse.id ? data.course : c))
      pendingUploadRef.current = null // Todo correcto, limpiamos pendingUpload
      setEditingCourse(null)
    } catch (error) {
      console.error(error)
      alert('Hubo un error al guardar los datos del curso.')
    } finally {
      setIsSaving(false)
    }
  }


  // =================== LOGICA CREACION CURSO ===================
  const handleCreateCourseSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourseData)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error al crear curso')
      }
      
      const data = await res.json()
      setCourses([...courses, data.course])
      pendingUploadRef.current = null // Todo correcto, limpiamos pendingUpload
      setIsCreatingCourse(false)
      setNewCourseData({ title: '', slug: '', description: '', shortDescription: '', image: '', type: 'Curso', modality: 'Virtual', published: false })
    } catch (error) {
      console.error(error)
      alert(error.message || 'Hubo un error al crear el curso.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('🚨 PELIGRO: ¿Estás seguro de que querés BORRAR ESTE CURSO COMPLETO? Se borrarán permanentemente todas sus instancias, progreso de alumnos, módulos y lecciones.\n\nESTA ACCIÓN NO SE PUEDE DESHACER.')) return

    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, { method: 'DELETE' })
      if (res.ok) {
        setCourses(courses.filter((c) => c.id !== courseId))
        setEditingCourse(null)
      } else {
        alert('Error al borrar el curso')
      }
    } catch (e) {
      alert('Error de red')
    }
  }


  // =================== RENDERIZADO ===================
  const filteredUsers = users
    .filter((user) => {
      const term = searchTerm.toLowerCase()
      return (
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.phone || '').toLowerCase().includes(term) ||
        (user.sparkName || '').toLowerCase().includes(term)
      )
    })
    .filter((user) => {
      if (filterHasCourseId && !userHasCourseAccess(user, filterHasCourseId)) return false
      if (filterNotCourseId && userHasCourseAccess(user, filterNotCourseId)) return false
      return true
    })
    .sort((a, b) => {
      const nameA = (a.firstName || '').trim()
      const nameB = (b.firstName || '').trim()
      const cmp = nameA.localeCompare(nameB, 'es', { sensitivity: 'base' })
      if (cmp === 0) {
        return (a.lastName || '').trim().localeCompare((b.lastName || '').trim(), 'es', { sensitivity: 'base' })
      }
      return cmp
    })

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />
      {/* Pestañas eliminadas - La navegación ahora es mediante el menú lateral */}
      {/* VISTA PARTICIPANTES */}
      {activeTab === 'users' && (
        <>
          <div className="p-6 border-b border-sel-lavender/20 bg-white">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-sel-purple">Participantes</h2>
                <p className="text-sm text-sel-body">Gestioná los usuarios y sus accesos.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingUser(true)}
                className="bg-sel-purple text-white px-5 py-2.5 rounded-xl font-bold hover:bg-sel-quote-icon transition shadow-sm whitespace-nowrap text-center"
              >
                + Crear Nuevo Participante
              </button>
            </div>
            
            <div className="flex items-center gap-4 w-full max-w-2xl">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  placeholder="Buscar por nombre, email, teléfono o chispa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sel-lavender/30 focus:outline-none focus:ring-2 focus:ring-sel-lavender text-sel-purple transition bg-sel-cream/30"
                />
                <div className="absolute left-3 top-3 text-sel-lavender">
                  <Search className="w-5 h-5" />
                </div>
              </div>
              <div className="text-sm text-sel-purple font-bold whitespace-nowrap bg-sel-cream px-3 py-1.5 rounded-lg border border-sel-lavender/30">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'usuario' : 'usuarios'}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-4 w-full max-w-3xl mt-4">
              <div className="flex-1 min-w-[220px]">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hizo el taller</label>
                <select
                  value={filterHasCourseId}
                  onChange={(e) => handleFilterHasCourseChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-sel-lavender/30 focus:outline-none focus:ring-2 focus:ring-sel-lavender text-sel-purple bg-white"
                >
                  <option value="">-- Todos --</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[220px]">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pero NO hizo</label>
                <select
                  value={filterNotCourseId}
                  onChange={(e) => setFilterNotCourseId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-sel-lavender/30 focus:outline-none focus:ring-2 focus:ring-sel-lavender text-sel-purple bg-white"
                >
                  <option value="">-- Ninguno --</option>
                  {courses.filter((course) => course.id !== filterHasCourseId).map((course) => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>
              {(filterHasCourseId || filterNotCourseId) && (
                <button
                  type="button"
                  onClick={() => { setFilterHasCourseId(''); setFilterNotCourseId('') }}
                  className="text-sm text-gray-500 hover:text-red-500 font-bold px-3 py-2.5 whitespace-nowrap"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-4 px-6 w-16">Perfil</th>
                  <th className="py-4 px-6">Información</th>
                  <th className="py-4 px-6">Rol</th>
                  <th className="py-4 px-6">Cursos</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      No se encontraron participantes.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/30 transition group">
                      <td className="py-4 px-6">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                          {user.image ? (
                            <img src={user.image} alt={user.firstName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <button 
                          onClick={() => openEditUser(user)}
                          className="font-bold text-[#33275f] text-base text-left hover:text-[#B681AE] transition"
                        >
                          {user.firstName} {user.lastName}
                          {user.sparkName && <span className="text-[#9187BA] font-normal ml-2">✨ {user.sparkName}</span>}
                        </button>
                        <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                          <span>{user.email}</span>
                          {user.emailVerified ? (
                            <span title="Email Verificado"><CheckCircle className="w-3.5 h-3.5 text-green-500" /></span>
                          ) : (
                            <span title="Email Pendiente de Verificación"><Shield className="w-3.5 h-3.5 text-amber-500" /></span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                          {user.phone && <span>Wa: {user.phone}</span>}
                          {user.country && <span>📍 {user.country}</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          user.role === 'Admin' ? 'bg-red-50 text-red-600' : user.role === 'Transmisor' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="text-xs font-bold text-[#B681AE] bg-[#B681AE]/10 px-3 py-1 rounded-full whitespace-nowrap">
                            {user.unlockedCourses?.length || 0} realizados
                          </span>
                          <span className="text-xs font-bold text-[#9187BA] bg-[#9187BA]/10 px-3 py-1 rounded-full whitespace-nowrap">
                            {user.unlockedInstances?.length || 0} instancias
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => openEditUser(user)}
                          className="text-[#9187BA] hover:text-[#33275f] font-bold text-sm bg-white border border-gray-200 hover:border-[#9187BA] px-4 py-2 rounded-lg transition shadow-sm"
                        >
                          Gestionar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* VISTA CURSOS */}
      {activeTab === 'courses' && (
        <div className="p-6">
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => setIsCreatingCourse(true)}
              className="bg-[#33275f] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#4c3c86] transition shadow-sm"
            >
              + Crear Nuevo Taller
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map(course => (
              <div key={course.id} className="border rounded-2xl p-5 shadow-sm bg-white hover:border-[#9187BA] transition relative flex flex-col">
                <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                  <span className={`w-3 h-3 rounded-full ${course.published ? 'bg-green-500' : 'bg-gray-300'}`} title={course.published ? 'Publicado' : 'Oculto'}></span>
                </div>
                
                {course.image && (
                  <div className="w-full h-32 mb-4 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative">
                    <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                  </div>
                )}
                
                <h3 className="font-bold text-[#33275f] text-lg mb-1 pr-6">{course.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-3 mb-4 mt-2">{course.shortDescription || 'Sin descripción'}</p>
                <button
                  onClick={() => setEditingCourse(course)}
                  className="bg-[#33275f] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#4c3c86] transition w-full"
                >
                  Editar Información
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA GALERIA */}
      {activeTab === 'gallery' && (
        <GalleryAdmin />
      )}

      {/* MODAL EDITAR USUARIO COMPLETO */}
      {cropModalImage && (
        <ImageCropperModal
          imageSrc={cropModalImage}
          onCropComplete={(blob) => {
            setCroppedImageBlob(blob)
            setEditImagePreview(URL.createObjectURL(blob))
            setCropModalImage(null)
          }}
          onCancel={() => {
            setCropModalImage(null)
            if (editFileInputRef.current) editFileInputRef.current.value = ''
          }}
        />
      )}

      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-full">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-[#33275f]">Gestionar Participante</h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-500">{editingUser.email}</p>
                  {editingUser.emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Verificado
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full" title="Pendiente de verificación">
                        <Shield className="w-3 h-3" /> Pendiente
                      </span>
                      <button 
                        onClick={async () => {
                          if (window.confirm('¿Forzar la verificación de este usuario?')) {
                            const formData = new FormData()
                            formData.append('forceVerify', 'true')
                            try {
                              const res = await fetch(`/api/admin/users/${editingUser.id}`, { method: 'PUT', body: formData })
                              if (res.ok) {
                                const data = await res.json()
                                setEditingUser(data.user)
                                setFilteredUsers(prev => prev.map(u => u.id === data.user.id ? data.user : u))
                              } else alert('Error al verificar.')
                            } catch (e) { alert('Error de conexión.') }
                          }
                        }}
                        className="text-[10px] font-bold uppercase tracking-wider text-white bg-[#9187BA] hover:bg-[#33275f] px-2 py-0.5 rounded-full transition shadow-sm"
                      >
                        Forzar Verificación
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-6 mt-6">
                  <button 
                    onClick={() => setUserTab('data')} 
                    className={`pb-2 text-sm font-bold border-b-2 transition ${userTab === 'data' ? 'border-[#33275f] text-[#33275f]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                    Datos Personales
                  </button>
                  <button 
                    onClick={() => setUserTab('access')} 
                    className={`pb-2 text-sm font-bold border-b-2 transition ${userTab === 'access' ? 'border-[#33275f] text-[#33275f]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                    Talleres y Accesos
                  </button>
                  <button 
                    onClick={() => setUserTab('resources')} 
                    className={`pb-2 text-sm font-bold border-b-2 transition ${userTab === 'resources' ? 'border-[#33275f] text-[#33275f]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                    Materiales
                  </button>
                </div>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              
              {userTab === 'data' && (
                <div className="max-w-2xl mx-auto space-y-8">
                <form id="editUserForm" onSubmit={handleUserSubmit} className="space-y-8">
                  
                  {/* Foto de Perfil */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                    <div className="relative w-24 h-24 shrink-0 rounded-full border-4 border-[#B681AE]/20 bg-white overflow-hidden flex items-center justify-center group">
                      {editImagePreview ? (
                        <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-10 h-10 text-gray-300" />
                      )}
                      
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <UploadCloud className="w-6 h-6 text-white" />
                      </div>
                      
                      <input 
                        ref={editFileInputRef}
                        type="file" 
                        name="image" 
                        accept="image/*" 
                        onChange={handleEditImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      />
                    </div>
                    <div className="text-center sm:text-left">
                      <span className="text-lg font-bold text-[#33275f] block mb-1">Foto de Perfil</span>
                      <p className="text-sm text-gray-500 mb-2">Haz clic en la imagen para cambiarla.</p>
                      {editImagePreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditImagePreview(null)
                            setCroppedImageBlob(null)
                            setRemoveImage(true)
                            if (editFileInputRef.current) editFileInputRef.current.value = ''
                          }}
                          className="text-xs text-red-500 font-bold hover:underline"
                        >
                          Eliminar foto
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Info Personal */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Información Personal</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Nombre</label>
                        <input type="text" name="firstName" required defaultValue={editingUser.firstName} className="w-full px-4 py-2.5 h-[46px] rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#9187BA] outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Apellido</label>
                        <input type="text" name="lastName" required defaultValue={editingUser.lastName} className="w-full px-4 py-2.5 h-[46px] rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#9187BA] outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Nombre de Chispa</label>
                        <input type="text" name="sparkName" defaultValue={editingUser.sparkName || ''} className="w-full px-4 py-2.5 h-[46px] rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#9187BA] outline-none" placeholder="Opcional" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Celular / WhatsApp</label>
                        <input type="text" name="phone" defaultValue={editingUser.phone || ''} className="w-full px-4 py-2.5 h-[46px] rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#9187BA] outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Fecha Nacimiento</label>
                        <input type="date" name="birthDate" defaultValue={editingUser.birthDate ? new Date(editingUser.birthDate).toISOString().split('T')[0] : ''} className="w-full px-4 py-2.5 h-[46px] rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#9187BA] outline-none text-gray-900" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Rol en la Plataforma</label>
                        <select 
                          name="role" 
                          key={`role-${editingUser.role}-${editingUser.unlockedCourses?.length}`}
                          defaultValue={(editingUser.role === 'Guest' && editingUser.unlockedCourses?.length > 0) ? 'Participante' : editingUser.role} 
                          className="w-full px-4 py-2.5 h-[46px] rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#9187BA] outline-none bg-white"
                        >
                          <option value="Guest">Invitado (Guest)</option>
                          <option value="Participante">Participante</option>
                          <option value="Transmisor">Transmisor</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Ubicación */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Ubicación</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Ciudad / Localidad</label>
                        <input type="text" name="city" defaultValue={editingUser.city || ''} className="w-full px-4 py-2.5 h-[46px] rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#9187BA] outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Provincia / Región</label>
                        <input type="text" name="province" defaultValue={editingUser.province || ''} className="w-full px-4 py-2.5 h-[46px] rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#9187BA] outline-none" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">País</label>
                        <select name="country" defaultValue={editingUser.country || ''} className="w-full px-4 py-2.5 h-[46px] rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#9187BA] outline-none bg-white">
                          <option value="">Seleccionar...</option>
                          {COUNTRIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </form>
                </div>
              )}

              {userTab === 'access' && (
                <div className="max-w-3xl mx-auto bg-gray-50/50 rounded-2xl border border-gray-100 p-6 flex flex-col h-full">
                  <h3 className="text-[#33275f] font-bold text-lg mb-2">Historial de Talleres y Accesos</h3>
                  <p className="text-sm text-gray-500 mb-6">Gestioná a qué talleres tiene acceso este usuario. Los cambios aquí se guardan instantáneamente.</p>
                  
                  <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                  {courses.map((course) => {
                    // Check if they have access to ANY instance of this course to color the course header
                    const hasAnyAccess = editingUser.unlockedCourses?.some((uc) => uc.courseId === course.id)
                    
                    return (
                      <div key={course.id} className="mb-4">
                        <div 
                          className={`p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${hasAnyAccess ? 'bg-white border-[#B681AE] shadow-sm' : 'bg-transparent border-gray-200 hover:bg-white'}`}
                          onClick={() => toggleCourseExpansion(course.id)}
                        >
                          <div className="flex-1 pr-4">
                            <p className={`font-bold text-sm ${hasAnyAccess ? 'text-[#33275f]' : 'text-gray-600'}`}>{course.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{course.type}</p>
                          </div>
                          <div className="text-gray-400">
                            {expandedCourses.has(course.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          </div>
                        </div>

                        {/* Instances List */}
                        {expandedCourses.has(course.id) && (
                          <div className="space-y-2 mt-2 pl-4 border-l-2 border-gray-100 ml-4 animate-in fade-in slide-in-from-top-2 duration-200">
                          {!course.instances || course.instances.length === 0 ? (
                            <p className="text-xs text-gray-400 py-2">No hay instancias creadas para este taller.</p>
                          ) : (
                            course.instances.map(instance => {
                              const isUnlocked = editingUser.unlockedInstances?.some((ui) => ui.courseInstanceId === instance.id)
                              const isLoading = updatingId === `${editingUser.id}-${instance.id}`
                              const dateStr = new Date(instance.startDate).toLocaleDateString('es-AR', { timeZone: 'UTC' })
                              
                              return (
                                <div key={instance.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                  <div className="text-sm">
                                    <span className="font-semibold text-gray-700">{dateStr}</span>
                                    {instance.location && <span className="text-xs text-gray-500 ml-2">({instance.location})</span>}
                                  </div>
                                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input 
                                      type="checkbox" 
                                      className="sr-only peer"
                                      checked={isUnlocked || false}
                                      disabled={isLoading}
                                      onChange={() => handleToggleAccess(editingUser.id, course.id, instance.id, isUnlocked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B681AE]"></div>
                                    {isLoading && (
                                      <span className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-full">
                                        <span className="w-4 h-4 border-2 border-[#33275f] border-t-transparent rounded-full animate-spin"></span>
                                      </span>
                                    )}
                                  </label>
                                </div>
                              )
                            })
                          )}
                            </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              )}

              {userTab === 'resources' && (
                <div className="max-w-3xl mx-auto bg-gray-50/50 rounded-2xl border border-gray-100 p-6 flex flex-col h-full">
                  <h3 className="text-[#33275f] font-bold text-lg mb-2">Materiales Disponibles</h3>
                  <p className="text-sm text-gray-500 mb-6">Esta es la lista final de archivos (PDFs, Audios, etc.) que el usuario puede ver en su plataforma basándose en sus accesos.</p>
                  
                  <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                    {(() => {
                      const userResources = getUserResources()
                      if (userResources.length === 0) {
                        return <p className="text-sm text-gray-500 text-center py-8">El usuario no tiene acceso a ningún material aún.</p>
                      }
                      return userResources.map(res => (
                        <div key={res.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-[#33275f] truncate">{res.name}</p>
                            <div className="flex gap-4 text-xs text-gray-500 mt-1 flex-wrap">
                              <span>📄 {res.type}</span>
                              <span className="text-[#B681AE] font-bold uppercase">{res.courseTitle}</span>
                              {res.isInstanceExclusive && <span className="text-blue-600 font-bold">Instancia</span>}
                            </div>
                          </div>
                          <button 
                            onClick={() => handlePreviewResource(res)}
                            disabled={previewingId === res.id}
                            className="shrink-0 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#33275f] text-sm font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {previewingId === res.id ? (
                              <span className="w-4 h-4 border-2 border-[#33275f] border-t-transparent rounded-full animate-spin"></span>
                            ) : null}
                            Abrir
                          </button>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              )}

            </div>

            {/* Footer Modal */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0 rounded-b-2xl">
              <button 
                onClick={() => handleDeleteUser(editingUser.id, `${editingUser.firstName} ${editingUser.lastName}`)}
                className="text-red-500 hover:text-red-700 font-bold text-sm underline px-2"
              >
                Eliminar Usuario
              </button>
              <div className="flex gap-3">
                {userTab === 'data' && (
                  <button 
                    type="submit" 
                    form="editUserForm"
                    disabled={isSaving} 
                    className="px-6 py-2.5 rounded-xl bg-[#33275f] text-white font-bold hover:bg-[#4c3c86] transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar Datos Personales'}
                  </button>
                )}
                <button type="button" onClick={() => setEditingUser(null)} className="px-5 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-200 transition">
                  Cerrar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL CREAR PARTICIPANTE */}
      {isCreatingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-[#33275f] mb-4">Crear Nuevo Participante</h2>
            <form onSubmit={handleCreateUserSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                    <input type="text" required value={newUserData.firstName} onChange={(e) => setNewUserData({...newUserData, firstName: e.target.value})} className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Apellido</label>
                    <input type="text" required value={newUserData.lastName} onChange={(e) => setNewUserData({...newUserData, lastName: e.target.value})} className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                  <input type="email" required value={newUserData.email} onChange={(e) => setNewUserData({...newUserData, email: e.target.value})} className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                  <input type="text" value={newUserData.phone} onChange={(e) => setNewUserData({...newUserData, phone: e.target.value})} className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none" placeholder="Opcional" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rol en la Plataforma</label>
                  <select value={newUserData.role} onChange={(e) => setNewUserData({...newUserData, role: e.target.value})} className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none bg-white">
                    <option value="Guest">Invitado (Guest)</option>
                    <option value="Participante">Participante</option>
                    <option value="Transmisor">Transmisor</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <p className="text-xs text-gray-400">La contraseña inicial se genera automáticamente a partir del email y se le puede informar al participante.</p>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCreatingUser(false)} className="px-4 py-2 rounded-xl text-gray-500 font-bold hover:bg-gray-100 transition">Cerrar</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2 rounded-xl bg-[#B681AE] text-white font-bold hover:bg-[#9187BA] transition disabled:opacity-50">
                  {isSaving ? 'Creando...' : 'Crear Participante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR CURSO COMPLETO */}
      {editingCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-[#33275f]">Gestionar Curso</h2>
                <p className="text-sm text-gray-500">{editingCourse.title}</p>
              </div>
              <button onClick={handleCancelCourseEdit} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden" style={{ flexDirection: 'row' }}>
              {/* Menú Lateral del Modal */}
              <div 
                className="bg-gray-50 border-r border-gray-200 shrink-0 overflow-y-auto"
                style={{ width: '260px', display: 'flex', flexDirection: 'column' }}
              >
                <button 
                  onClick={() => setCourseTab('data')}
                  className={`px-6 py-4 text-left font-bold text-sm whitespace-nowrap transition-colors border-l-4 ${courseTab === 'data' ? 'bg-white text-[#33275f] border-[#B681AE]' : 'text-gray-500 border-transparent hover:bg-gray-100'}`}
                >
                  Datos Base
                </button>
                <button 
                  onClick={() => setCourseTab('instances')}
                  className={`px-6 py-4 text-left font-bold text-sm whitespace-nowrap transition-colors border-l-4 ${courseTab === 'instances' ? 'bg-white text-[#33275f] border-[#B681AE]' : 'text-gray-500 border-transparent hover:bg-gray-100'}`}
                >
                  Instancias Programadas
                </button>
                <button 
                  onClick={() => setCourseTab('resources')}
                  className={`px-6 py-4 text-left font-bold text-sm whitespace-nowrap transition-colors border-l-4 ${courseTab === 'resources' ? 'bg-white text-[#33275f] border-[#B681AE]' : 'text-gray-500 border-transparent hover:bg-gray-100'}`}
                >
                  Materiales y Archivos
                </button>
              </div>

              {/* Contenido de la Pestaña */}
              <div className="flex-1 overflow-y-auto p-6 bg-white">
                
                {courseTab === 'data' && (
                  <form id="editCourseForm" onSubmit={handleCourseSubmit} className="max-w-2xl">
                    <h3 className="text-lg font-bold text-[#33275f] mb-6">Información General</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label>
                        <input type="text" required value={editingCourse.title} onChange={(e) => setEditingCourse({...editingCourse, title: e.target.value})} className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Slug (URL amigable)</label>
                          <input type="text" required value={editingCourse.slug} onChange={(e) => setEditingCourse({...editingCourse, slug: e.target.value})} className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
                          <select value={editingCourse.type} onChange={(e) => setEditingCourse({...editingCourse, type: e.target.value})} className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none bg-white">
                            <option value="Curso">Curso</option>
                            <option value="Taller">Taller</option>
                            <option value="Iniciacion">Iniciación</option>
                            <option value="Activacion">Activación</option>
                            <option value="Retiro">Retiro</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Modalidad</label>
                          <select value={editingCourse.modality || 'Virtual'} onChange={(e) => setEditingCourse({...editingCourse, modality: e.target.value})} className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none bg-white">
                            <option value="Virtual">Virtual</option>
                            <option value="Presencial">Presencial</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                        <textarea rows="4" value={editingCourse.description || ''} onChange={(e) => setEditingCourse({...editingCourse, description: e.target.value})} className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none resize-none"></textarea>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción Corta (Catálogo)</label>
                        <textarea rows="2" value={editingCourse.shortDescription || ''} onChange={(e) => setEditingCourse({...editingCourse, shortDescription: e.target.value})} className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none resize-none" placeholder="Resumen breve para la grilla..."></textarea>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Imagen de Portada</label>
                        <div className="flex gap-2">
                          <input type="text" value={editingCourse.image || ''} onChange={(e) => setEditingCourse({...editingCourse, image: e.target.value})} className="flex-1 px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none" placeholder="/assets/foto.jpg o URL" />
                          
                          {editingCourse.image && (
                            <button type="button" disabled={isUploading} onClick={() => handleDeleteCourseImage(false)} className="bg-red-500 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-red-600 transition flex items-center justify-center disabled:opacity-50" title="Borrar imagen de Cloudinary">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          <button type="button" disabled={isUploading} onClick={() => openCloudinaryCourseWidget(false)} className="bg-[#B681AE] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#9187BA] transition flex items-center gap-2 disabled:opacity-50">
                            <UploadCloud className="w-4 h-4" />
                            {isUploading ? '...' : 'Subir'}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <input type="checkbox" id="published" checked={editingCourse.published} onChange={(e) => setEditingCourse({...editingCourse, published: e.target.checked})} className="w-5 h-5 rounded text-[#33275f] focus:ring-[#9187BA] border-gray-300 transition" />
                        <label htmlFor="published" className="text-sm font-bold text-[#33275f] cursor-pointer">Hacer visible (Publicado)</label>
                      </div>
                    </div>
                  </form>
                )}

                {courseTab === 'instances' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-[#33275f]">Eventos e Instancias</h3>
                      <button onClick={() => setIsCreatingInstance(!isCreatingInstance)} className="bg-[#33275f] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#4c3c86] transition">
                        {isCreatingInstance ? 'Cancelar' : '+ Nueva Instancia'}
                      </button>
                    </div>

                    {isCreatingInstance && (
                      <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-6">
                        <h4 className="font-bold text-sm text-[#33275f] mb-3">Crear Nueva Instancia</h4>
                        <form onSubmit={handleCreateInstance} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Fecha de Inicio</label>
                            <input type="date" required value={newInstanceData.startDate} onChange={(e) => setNewInstanceData({...newInstanceData, startDate: e.target.value})} className="w-full px-3 py-2 rounded-lg border outline-none text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Fecha de Fin (Opcional)</label>
                            <input type="date" value={newInstanceData.endDate} onChange={(e) => setNewInstanceData({...newInstanceData, endDate: e.target.value})} className="w-full px-3 py-2 rounded-lg border outline-none text-sm" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Ubicación / Modalidad</label>
                            <input type="text" placeholder="Ej: Zoom, o Buenos Aires" value={newInstanceData.location} onChange={(e) => setNewInstanceData({...newInstanceData, location: e.target.value})} className="w-full px-3 py-2 rounded-lg border outline-none text-sm" />
                          </div>
                          <div className="md:col-span-2 flex justify-end">
                            <button type="submit" disabled={isSaving} className="bg-[#B681AE] text-white px-6 py-2 rounded-lg font-bold text-sm disabled:opacity-50 hover:bg-[#9187BA] transition">
                              {isSaving ? 'Guardando...' : 'Guardar Instancia'}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                      {!editingCourse.instances || editingCourse.instances.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-8">No hay instancias programadas para este curso.</p>
                      ) : (
                        editingCourse.instances.map(inst => {
                          if (editingInstanceId === inst.id) {
                            return (
                              <div key={inst.id} className="bg-gray-50 p-5">
                                <h4 className="font-bold text-sm text-[#33275f] mb-3">Editar Instancia</h4>
                                <form onSubmit={handleEditInstanceSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Fecha de Inicio</label>
                                    <input type="date" required value={newInstanceData.startDate} onChange={(e) => setNewInstanceData({...newInstanceData, startDate: e.target.value})} className="w-full px-3 py-2 rounded-lg border outline-none text-sm" />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Fecha de Fin (Opcional)</label>
                                    <input type="date" value={newInstanceData.endDate} onChange={(e) => setNewInstanceData({...newInstanceData, endDate: e.target.value})} className="w-full px-3 py-2 rounded-lg border outline-none text-sm" />
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Ubicación / Modalidad</label>
                                    <input type="text" placeholder="Ej: Zoom, o Buenos Aires" value={newInstanceData.location} onChange={(e) => setNewInstanceData({...newInstanceData, location: e.target.value})} className="w-full px-3 py-2 rounded-lg border outline-none text-sm" />
                                  </div>
                                  <div className="md:col-span-2 flex justify-end gap-2">
                                    <button type="button" onClick={() => setEditingInstanceId(null)} className="px-4 py-2 rounded-lg text-gray-500 text-sm font-bold hover:bg-gray-100 transition">
                                      Cancelar
                                    </button>
                                    <button type="submit" disabled={isSaving} className="bg-[#B681AE] text-white px-6 py-2 rounded-lg font-bold text-sm disabled:opacity-50 hover:bg-[#9187BA] transition">
                                      {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                  </div>
                                </form>
                              </div>
                            )
                          }
                          return (
                            <div key={inst.id} className="p-3 flex justify-between items-center hover:bg-gray-50 transition group">
                              <div className="flex items-center gap-6">
                                <p className="font-bold text-sm text-[#33275f] min-w-[90px]">
                                  {new Date(inst.startDate).toLocaleDateString('es-AR', { timeZone: 'UTC' })}
                                </p>
                                {inst.location && <span className="text-xs text-gray-500">📍 {inst.location}</span>}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button onClick={() => setManagingInstanceUsers({ courseId: editingCourse.id, instanceId: inst.id, courseTitle: editingCourse.title, dateStr: new Date(inst.startDate).toLocaleDateString('es-AR', { timeZone: 'UTC' }) })} className="text-[#33275f] hover:bg-[#33275f]/10 p-1.5 rounded-lg transition" title="Gestionar Alumnos">
                                  <Users className="w-4 h-4" />
                                </button>
                                <button onClick={() => startEditInstance(inst)} className="text-[#9187BA] hover:bg-[#9187BA]/10 p-1.5 rounded-lg transition" title="Editar Instancia">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteInstance(inst.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition" title="Borrar Instancia">
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}

                {courseTab === 'resources' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-[#33275f]">Archivos y Materiales del Curso</h3>
                      
                      {!selectedFile && (
                        <div className="relative">
                          <input 
                            type="file" 
                            ref={resourceInputRef}
                            onChange={handleFileSelect}
                            disabled={isUploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                          />
                          <button disabled={isUploading} className="bg-[#B681AE] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#9187BA] transition flex items-center gap-2 disabled:opacity-50">
                            <UploadCloud className="w-4 h-4" />
                            Seleccionar Archivo
                          </button>
                        </div>
                      )}
                    </div>

                    {selectedFile && (
                      <div className="mb-6 p-5 bg-blue-50/50 rounded-xl border border-blue-100">
                        <h4 className="font-bold text-[#33275f] text-sm mb-4">Preparar Subida</h4>
                        <div className="space-y-4">
                          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-500 uppercase">Archivo actual</span>
                              <span className="text-sm font-bold text-[#33275f] truncate max-wxs mt-0.5">
                                {selectedFile.name}
                              </span>
                            </div>
                            <div>
                              <button 
                                type="button" 
                                onClick={() => document.getElementById('changeFileInput').click()}
                                disabled={isUploading}
                                className="text-xs bg-[#B681AE]/10 hover:bg-[#B681AE]/20 text-[#B681AE] px-3 py-2 rounded-lg font-bold transition disabled:opacity-50"
                              >
                                Cambiar
                              </button>
                              <input 
                                id="changeFileInput"
                                type="file" 
                                className="hidden" 
                                onChange={handleFileSelect}
                                disabled={isUploading}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Público del Archivo</label>
                            <input 
                              type="text" 
                              value={newResourceName} 
                              onChange={(e) => setNewResourceName(e.target.value)}
                              placeholder="Ej: Meditación Guiada Nro 1"
                              className="w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-[#B681AE]"
                              disabled={isUploading}
                            />
                            <p className="text-xs text-gray-400 mt-1">Este nombre servirá para reemplazar archivos viejos y lo verán los alumnos.</p>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción (Opcional)</label>
                            <textarea 
                              value={newResourceDescription} 
                              onChange={(e) => setNewResourceDescription(e.target.value)}
                              placeholder="Breve descripción del archivo (de qué trata, qué incluye, etc.)"
                              className="w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-[#B681AE]"
                              disabled={isUploading}
                              rows={2}
                            />
                          </div>

                          {editingCourse.instances && editingCourse.instances.length > 0 && (
                            <div>
                              <label className="block text-sm font-bold text-[#33275f] mb-1">
                                ¿Asignar a una instancia específica? (Opcional)
                              </label>
                              <select 
                                value={newResourceInstanceId} 
                                onChange={e => setNewResourceInstanceId(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border outline-none text-sm text-gray-700 bg-white focus:ring-2 focus:ring-[#B681AE]"
                                disabled={isUploading}
                              >
                                <option value="">-- Curso Base (Lo ven todas las instancias) --</option>
                                {editingCourse.instances.map(inst => (
                                  <option key={inst.id} value={inst.id}>
                                    Instancia: {new Date(inst.startDate).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })} ({inst.location})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-bold text-[#33275f] mb-1">
                              ¿Reemplaza a un archivo anterior? (Opcional)
                            </label>
                            <select 
                              value={overrideResourceId} 
                              onChange={e => setOverrideResourceId(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border outline-none text-sm text-gray-700 bg-white focus:ring-2 focus:ring-[#B681AE]"
                              disabled={isUploading}
                            >
                              <option value="">-- No, es un archivo nuevo --</option>
                              {courses.flatMap(c => (c.resources || []).map(r => ({ ...r, courseName: c.title }))).map(r => (
                                <option key={r.id} value={r.id}>{r.name} ({r.courseName})</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex justify-end gap-3 pt-2">
                            <button 
                              type="button" 
                              onClick={handleCancelFileSelect}
                              disabled={isUploading}
                              className="px-4 py-2 rounded-xl text-gray-600 font-bold hover:bg-gray-200 transition disabled:opacity-50 text-sm"
                            >
                              Cancelar
                            </button>
                            <button 
                              onClick={handleUploadResource}
                              disabled={isUploading || !newResourceName.trim()}
                              className="bg-[#33275f] text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#4c3c86] transition flex items-center gap-2 disabled:opacity-50"
                            >
                              <UploadCloud className="w-4 h-4" />
                              {isUploading ? 'Subiendo...' : 'Confirmar y Subir'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {!editingCourse.resources || editingCourse.resources.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4 italic">
                          No hay archivos en este curso.
                        </p>
                      ) : (
                        editingCourse.resources.map(res => {
                          if (editingResourceId === res.id) {
                            return (
                              <div key={res.id} className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                <h4 className="font-bold text-sm text-[#33275f] mb-3">Editar Archivo</h4>
                                <form onSubmit={handleEditResourceSubmit} className="space-y-4">
                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Público</label>
                                    <input 
                                      type="text" 
                                      value={editResourceData.name} 
                                      onChange={(e) => setEditResourceData({...editResourceData, name: e.target.value})}
                                      className="w-full px-3 py-2 rounded-lg border outline-none text-sm"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                                    <textarea 
                                      value={editResourceData.description} 
                                      onChange={(e) => setEditResourceData({...editResourceData, description: e.target.value})}
                                      className="w-full px-3 py-2 rounded-lg border outline-none text-sm"
                                      rows={2}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Reemplazar Archivo (Opcional)
                                    </label>
                                    <input 
                                      type="file" 
                                      onChange={(e) => setEditSelectedFile(e.target.files[0])}
                                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#33275f]/5 file:text-[#33275f] hover:file:bg-[#33275f]/10"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Si seleccionas un archivo, el anterior será eliminado permanentemente.</p>
                                  </div>
                                  {editingCourse.instances && editingCourse.instances.length > 0 && (
                                    <div>
                                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                        Asignar a una instancia específica
                                      </label>
                                      <select 
                                        value={editResourceData.courseInstanceId || ''} 
                                        onChange={e => setEditResourceData({...editResourceData, courseInstanceId: e.target.value})}
                                        className="w-full px-3 py-2 rounded-lg border outline-none text-sm bg-white focus:ring-2 focus:ring-[#B681AE]"
                                      >
                                        <option value="">-- Curso Base (Lo ven todas las instancias) --</option>
                                        {editingCourse.instances.map(inst => (
                                          <option key={inst.id} value={inst.id}>
                                            Instancia: {new Date(inst.startDate).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })} ({inst.location})
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  )}
                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reemplaza a un archivo anterior</label>
                                    <select 
                                      value={editResourceData.overridesResourceId} 
                                      onChange={(e) => setEditResourceData({...editResourceData, overridesResourceId: e.target.value})}
                                      className="w-full px-3 py-2 rounded-lg border outline-none text-sm bg-white"
                                    >
                                      <option value="">-- No reemplaza a ninguno --</option>
                                      {courses.flatMap(c => (c.resources || []).map(r => ({ ...r, courseName: c.title }))).filter(r => r.id !== res.id).map(r => (
                                        <option key={r.id} value={r.id}>{r.name} ({r.courseName})</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex justify-end gap-2 pt-2">
                                    <button type="button" onClick={() => setEditingResourceId(null)} className="px-4 py-2 rounded-lg text-gray-500 text-sm font-bold hover:bg-gray-100 transition">
                                      Cancelar
                                    </button>
                                    <button type="submit" disabled={isSaving} className="bg-[#B681AE] text-white px-6 py-2 rounded-lg font-bold text-sm disabled:opacity-50 hover:bg-[#9187BA] transition">
                                      {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                  </div>
                                </form>
                              </div>
                            )
                          }
                          return (
                            <div key={res.id} className="border border-gray-100 rounded-xl p-4 flex justify-between items-center bg-white shadow-sm hover:border-[#9187BA] transition group">
                              <div className="flex-1 min-w-0 pr-4">
                                <p className="font-bold text-[#33275f] truncate">{res.name}</p>
                                {res.description && <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">{res.description}</p>}
                                <div className="flex gap-4 text-xs text-gray-500 mt-1 flex-wrap">
                                  <span>📄 {res.type}</span>
                                  {res.isDownloadable && <span className="text-green-600 font-bold">Descargable</span>}
                                  {res.overridesResourceId && <span className="text-[#B681AE] font-bold">Reemplaza un archivo</span>}
                                  {res.courseInstanceId && (
                                    <span className="text-blue-600 font-bold">
                                      Exclusivo Instancia
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handlePreviewResource(res)} 
                                  disabled={previewingId === res.id}
                                  className="text-[#9187BA] hover:text-[#33275f] bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                                  title="Ver Preview"
                                >
                                  {previewingId === res.id ? 'Cargando...' : <><Eye className="w-4 h-4" /> Preview</>}
                                </button>
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition">
                                  <button onClick={() => startEditResource(res)} className="text-[#9187BA] hover:bg-[#9187BA]/10 p-2 rounded-lg transition" title="Editar Archivo">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteResource(res.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition" title="Borrar Archivo">
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0 rounded-b-2xl">
              <div>
                {courseTab === 'data' && (
                  <button 
                    type="button" 
                    onClick={() => handleDeleteCourse(editingCourse.id)}
                    className="px-4 py-2.5 rounded-xl text-red-500 font-bold hover:bg-red-50 transition flex items-center gap-2"
                    title="Borrar curso permanentemente"
                  >
                    <Trash2 className="w-5 h-5" />
                    Borrar Curso
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={handleCancelCourseEdit} className="px-5 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-200 transition">
                  Cerrar
                </button>
                {courseTab === 'data' && (
                  <button 
                    type="submit" 
                    form="editCourseForm"
                    disabled={isSaving} 
                    className="px-6 py-2.5 rounded-xl bg-[#33275f] text-white font-bold hover:bg-[#4c3c86] transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar Datos Base'}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL CREAR CURSO */}
      {isCreatingCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-[#33275f] mb-4">Crear Nuevo Curso/Taller</h2>
            <form onSubmit={handleCreateCourseSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label>
                  <input type="text" required value={newCourseData.title} onChange={(e) => setNewCourseData({...newCourseData, title: e.target.value})} className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none" placeholder="Ej: Sanación de la Duda" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Slug (URL amigable)</label>
                  <input type="text" required value={newCourseData.slug} onChange={(e) => setNewCourseData({...newCourseData, slug: e.target.value})} className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none" placeholder="Ej: sanacion-de-la-duda" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Curso</label>
                  <select value={newCourseData.type} onChange={(e) => setNewCourseData({...newCourseData, type: e.target.value})} className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none bg-white">
                    <option value="Curso">Curso</option>
                    <option value="Taller">Taller</option>
                    <option value="Iniciacion">Iniciación</option>
                    <option value="Activacion">Activación</option>
                    <option value="Retiro">Retiro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Modalidad</label>
                  <select value={newCourseData.modality || 'Virtual'} onChange={(e) => setNewCourseData({...newCourseData, modality: e.target.value})} className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none bg-white">
                    <option value="Virtual">Virtual</option>
                    <option value="Presencial">Presencial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                  <textarea rows="3" value={newCourseData.description || ''} onChange={(e) => setNewCourseData({...newCourseData, description: e.target.value})} className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none resize-none" placeholder="Breve descripción del curso..."></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción Corta (Catálogo)</label>
                  <textarea rows="2" value={newCourseData.shortDescription || ''} onChange={(e) => setNewCourseData({...newCourseData, shortDescription: e.target.value})} className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none resize-none" placeholder="Resumen breve para la grilla..."></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Imagen de Portada</label>
                  <div className="flex gap-2">
                    <input type="text" value={newCourseData.image || ''} onChange={(e) => setNewCourseData({...newCourseData, image: e.target.value})} className="flex-1 px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none" placeholder="/assets/foto.jpg o URL" />
                    
                    {newCourseData.image && (
                      <button type="button" disabled={isUploading} onClick={() => handleDeleteCourseImage(true)} className="bg-red-500 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-red-600 transition flex items-center justify-center disabled:opacity-50" title="Borrar imagen de Cloudinary">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button type="button" disabled={isUploading} onClick={() => openCloudinaryCourseWidget(true)} className="bg-[#B681AE] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#9187BA] transition flex items-center gap-2 disabled:opacity-50">
                      <UploadCloud className="w-4 h-4" />
                      {isUploading ? '...' : 'Subir'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="publishedNew" checked={newCourseData.published} onChange={(e) => setNewCourseData({...newCourseData, published: e.target.checked})} className="w-5 h-5 rounded text-[#33275f] focus:ring-[#9187BA] border-gray-300 transition" />
                  <label htmlFor="publishedNew" className="text-sm font-bold text-gray-700 cursor-pointer">Hacer visible (Publicado) ahora</label>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={handleCancelCourseEdit} className="px-4 py-2 rounded-xl text-gray-500 font-bold hover:bg-gray-100 transition">Cerrar</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2 rounded-xl bg-[#B681AE] text-white font-bold hover:bg-[#9187BA] transition disabled:opacity-50">
                  {isSaving ? 'Creando...' : 'Crear Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GESTIONAR ALUMNOS DE INSTANCIA */}
      {managingInstanceUsers && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Encabezado */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-[#33275f]">Alumnos de {managingInstanceUsers.courseTitle}</h2>
                <p className="text-sm text-gray-500 mt-1">Instancia: {managingInstanceUsers.dateStr}</p>
              </div>
              <button 
                onClick={() => {
                  setManagingInstanceUsers(null)
                  setInstanceSearchTerm('')
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Buscador */}
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar alumno por nombre o email..."
                  value={instanceSearchTerm}
                  onChange={(e) => setInstanceSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] transition bg-white"
                />
              </div>
            </div>

            {/* Lista de Alumnos */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {users
                .filter(u => 
                  u.firstName?.toLowerCase().includes(instanceSearchTerm.toLowerCase()) ||
                  u.lastName?.toLowerCase().includes(instanceSearchTerm.toLowerCase()) ||
                  u.email?.toLowerCase().includes(instanceSearchTerm.toLowerCase())
                )
                .sort((a, b) => {
                  const nameA = (a.firstName || '').trim()
                  const nameB = (b.firstName || '').trim()
                  const cmp = nameA.localeCompare(nameB, 'es', { sensitivity: 'base' })
                  if (cmp === 0) {
                    return (a.lastName || '').trim().localeCompare((b.lastName || '').trim(), 'es', { sensitivity: 'base' })
                  }
                  return cmp
                })
                .map(user => {
                  const isUnlocked = user.unlockedInstances?.some(ui => ui.courseInstanceId === managingInstanceUsers.instanceId)
                  const isLoading = updatingId === `${user.id}-${managingInstanceUsers.instanceId}`
                  
                  return (
                    <div key={user.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img src={user.image} alt={user.firstName} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#B681AE]/20 flex items-center justify-center text-[#B681AE] font-bold">
                            {user.firstName?.charAt(0) || ''}{user.lastName?.charAt(0) || ''}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-sm text-[#33275f]">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={isUnlocked || false}
                          disabled={isLoading}
                          onChange={() => handleToggleAccess(user.id, managingInstanceUsers.courseId, managingInstanceUsers.instanceId, isUnlocked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B681AE]"></div>
                        {isLoading && (
                          <span className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-full">
                            <span className="w-4 h-4 border-2 border-[#33275f] border-t-transparent rounded-full animate-spin"></span>
                          </span>
                        )}
                      </label>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
