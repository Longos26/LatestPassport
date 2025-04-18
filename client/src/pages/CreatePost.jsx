import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase, { CDNURL } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import RichTextEditor from '../components/RichTextEditor';

export default function CreatePost() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imageUploadError, setImageUploadError] = useState(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    content: '', 
    category: 'uncategorized', 
    image: '' 
  });
  const [publishError, setPublishError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      setPublishError('Title and content are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/post/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setPublishError(data.message);
        return;
      }
      navigate(`/post/${data.slug}`);
    } catch (error) {
      setPublishError('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadImage = async () => {
    if (!file) {
      setImageUploadError('Please select an image');
      return;
    }

    setUploading(true);
    setImageUploadError(null);

    try {
      const fileName = `${uuidv4()}-${file.name}`;

      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from('passportinteractiveboard')
        .upload(fileName, file);

      if (error) {
        throw new Error(error.message);
      }

      // Construct public URL
      const imageUrl = `${CDNURL}${fileName}`;
      setFormData((prev) => ({ ...prev, image: imageUrl }));
    } catch (error) {
      console.error('Upload failed:', error);
      setImageUploadError('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const categories = [
    { value: 'uncategorized', label: 'Select a category' },
    { value: 'appointment', label: 'Appointment' },
    { value: 'passport', label: 'Passport' },
    { value: 'renewal', label: 'Renewal' },
    { value: 'tracking', label: 'Tracking' },
    { value: 'visa', label: 'Visa' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-center mb-10 text-gray-900 dark:text-white">Create a Post</h1>
      
      {publishError && (
        <div className="mb-6 p-4 border-l-4 border-red-500 bg-red-50 text-red-700 rounded dark:bg-red-900 dark:border-red-400 dark:text-red-300">
          <p className="font-medium">{publishError}</p>
        </div>
      )}
      
      <form className="space-y-8" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
            Title
          </label>
          <input
            id="title"
            type="text"
            placeholder="Enter post title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
            Category
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Cover Image
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Click to upload</span> or drag and drop
                  </p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
              </label>
              <button
                type="button"
                onClick={handleUploadImage}
                disabled={uploading || !file}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  uploading || !file
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
            
            {imageUploadError && (
              <p className="mt-2 text-sm text-red-600">{imageUploadError}</p>
            )}
          </div>

          {/* Image Preview */}
          {(preview || formData.image) && (
            <div className="mt-4">
              <div className="relative rounded-lg overflow-hidden shadow-md">
                <img 
                  src={formData.image || preview} 
                  alt="Preview" 
                  className="w-full h-64 object-cover"
                />
                {formData.image && (
                  <div className="absolute bottom-2 right-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Uploaded
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
            Content
          </label>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <RichTextEditor onChange={(content) => setFormData({ ...formData, content })} />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
              isSubmitting 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {isSubmitting ? 'Publishing...' : 'Publish Post'}
          </button>
        </div>
      </form>
    </div>
  );
}