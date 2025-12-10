<template>
  <div
    class="relative flex justify-center rounded-lg border border-dashed px-4 py-6 transition-all duration-200 cursor-pointer"
    :class="[
      isDragging ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/50',
      hasError && !preview ? 'border-red-500 bg-red-50' : '',
      preview ? 'p-0 border-solid border-border' : ''
    ]"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop"
  >
    <input
      type="file"
      @change="filesChange($event.target as HTMLInputElement)"
      accept="image/*"
      class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      :ref="setInputRef"
    />
    
    <!-- Upload placeholder -->
    <div v-if="!preview" class="text-center pointer-events-none">
      <ImagePlus class="mx-auto h-8 w-8 text-muted-foreground" />
      <p class="mt-2 text-xs text-muted-foreground">Click or drag</p>
    </div>
    
    <!-- Image preview -->
    <div
      v-if="preview"
      class="relative w-full h-32 bg-cover bg-center rounded-md"
      :style="{ backgroundImage: `url(${imageUrl})` }"
    >
      <button 
        type="button" 
        @click.stop="resetImageField" 
        class="absolute top-1 right-1 rounded-full bg-white/90 p-1.5 text-gray-600 shadow-sm hover:bg-red-500 hover:text-white transition-colors z-20"
        aria-label="Remove image"
      >
        <X class="h-3 w-3" />
      </button>
    </div>
    
    <!-- Processing overlay -->
    <div v-if="isProcessing" class="absolute inset-0 flex flex-col items-center justify-center bg-white/90 rounded-lg z-30">
      <Loader2 class="h-6 w-6 animate-spin text-primary" />
      <span class="mt-1 text-xs text-muted-foreground">Processing...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, watch } from 'vue'
import { ImagePlus, X, Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  modelValue?: string
  required?: boolean
  hasError?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// State
const preview = ref(false)
const imageUrl = ref('')
const isDragging = ref(false)
const isProcessing = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    preview.value = true
    imageUrl.value = newVal
  } else {
    preview.value = false
    imageUrl.value = ''
  }
}, { immediate: true })

const setInputRef = (el: any) => {
  inputRef.value = el
}

const filesChange = async (input: HTMLInputElement) => {
  const files = input.files
  if (!files || files.length === 0) return
  await processFile(files[0])
}

const onDrop = async (event: DragEvent) => {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return
  
  if (!files[0].type.startsWith('image/')) {
    return
  }
  
  await processFile(files[0])
}

const processFile = async (file: File) => {
  const MAX_FILE_SIZE = 10 * 1024 * 1024
  if (file.size > MAX_FILE_SIZE) {
    alert('File too large. Maximum size is 10MB.')
    return
  }
  
  isProcessing.value = true
  
  try {
    preview.value = true
    
    if (imageUrl.value && imageUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl.value)
    }
    imageUrl.value = URL.createObjectURL(file)
    
    const encodedImage = await encodeImage(file)
    emit('update:modelValue', encodedImage)
  } catch (error) {
    console.error('Error processing image:', error)
  } finally {
    isProcessing.value = false
  }
}

const resetImageField = () => {
  if (inputRef.value) {
    inputRef.value.value = ''
  }
  preview.value = false
  if (imageUrl.value && imageUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(imageUrl.value)
  }
  imageUrl.value = ''
  emit('update:modelValue', '')
}

const encodeImage = (image: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(image)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
  })
}

onBeforeUnmount(() => {
  if (imageUrl.value && imageUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(imageUrl.value)
  }
})
</script>


