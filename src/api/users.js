import apiClient from "../lib/apiClient";

export const usersAPI = {
  getUser: (id) => apiClient.get(`/users/${id}`),
  updateUser: (userId, updateData) => apiClient.patch(`/users/${userId}`, updateData),
  uploadPersonalPhoto: (userId, file) => {
    const formData = new FormData();
    formData.append('personal-photo', file);
    
    return apiClient.post('/users/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-User-Id': userId,
      },
    });
  },
  changePassword: (userId, oldPassword, newPassword) => {
    return apiClient.post('/users/change-password', 
      { oldPassword, newPassword },
      {
        headers: {
          'X-User-Id': userId,
        },
      }
    );
  },
}