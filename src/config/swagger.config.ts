import swaggerJsDoc from 'swagger-jsdoc';

const options: swaggerJsDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MYCARSOL API Documentation',
      version: '1.0.0',
      description: 'RESTful API documentation for MYCARSOL backend application including Mechanics, Admin, and Dynamic Categories.',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Admin: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '670123456789abcdef012345' },
            email: { type: 'string', example: 'admin@mycarsol.com' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AdminLoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'admin@mycarsol.com' },
            password: { type: 'string', example: 'password123' },
          },
        },
        MechanicLoginInput: {
          type: 'object',
          required: ['password'],
          properties: {
            email: { type: 'string', example: 'alex.mechanic@pro.com' },
            mobile: { type: 'string', example: '+919820144210' },
            password: { type: 'string', example: 'Password123!' },
          },
        },
        AdminCreateInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'newadmin@mycarsol.com' },
            password: { type: 'string', example: 'password123' },
          },
        },
        AdminUpdateInput: {
          type: 'object',
          properties: {
            email: { type: 'string', example: 'updatedadmin@mycarsol.com' },
            password: { type: 'string', example: 'newpassword123' },
          },
        },
        Mechanic: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '670123456789abcdef012399' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john.mechanic@mycarsol.com' },
            mobile: { type: 'string', example: '+919876543210' },
            profileImage: { type: 'string', example: 'https://storage.mycarsol.com/profiles/john.jpg' },
            category: {
              type: 'object',
              properties: {
                id: { type: 'string', example: '6701a9b8f1234567890abcde' },
                name: { type: 'string', example: 'Mechanic' },
                fields: {
                  type: 'object',
                  example: { experienceYears: 5, certificates: ['ASE Certified'] },
                },
              },
            },
            subCategory: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: '6701a9b8f1234567890abfff' },
                  name: { type: 'string', example: 'AC Mechanic' },
                  fields: {
                    type: 'object',
                    example: { refrigerantHandlingCertified: true },
                  },
                },
              },
            },
            address: {
              type: 'object',
              properties: {
                fullAddress: { type: 'string', example: '123 Main St, Tech Zone, Dallas' },
                streetAddress: { type: 'string', example: '123 Main St' },
                city: { type: 'string', example: 'Dallas' },
                state: { type: 'string', example: 'Texas' },
                pincode: { type: 'string', example: '75001' },
              },
            },
            location: {
              type: 'object',
              properties: {
                lat: { type: 'number', example: 32.7767 },
                long: { type: 'number', example: -96.797 },
              },
            },
            kyc: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  documentType: { type: 'string', example: 'Aadhaar' },
                  documentNumber: { type: 'string', example: '1234-5678-9012' },
                  documentUrl: { type: 'string', example: 'https://storage.mycarsol.com/kyc/aadhaar.pdf' },
                  isVerified: { type: 'boolean', example: false },
                },
              },
            },
            status: { type: 'string', example: 'pending' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        MechanicCreateInput: {
          type: 'object',
          required: ['name', 'email', 'mobile', 'password', 'category', 'address'],
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john.mechanic@mycarsol.com' },
            mobile: { type: 'string', example: '+919876543210' },
            password: { type: 'string', example: 'password123' },
            profileImage: { type: 'string', example: 'https://storage.mycarsol.com/profiles/john.jpg' },
            category: {
              type: 'object',
              required: ['id', 'name'],
              properties: {
                id: { type: 'string', example: '6701a9b8f1234567890abcde' },
                name: { type: 'string', example: 'Mechanic' },
                fields: {
                  type: 'object',
                  example: { experienceYears: 5, certificates: ['ASE Certified'] },
                },
              },
            },
            subCategory: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name'],
                properties: {
                  id: { type: 'string', example: '6701a9b8f1234567890abfff' },
                  name: { type: 'string', example: 'AC Mechanic' },
                  fields: {
                    type: 'object',
                    example: { refrigerantHandlingCertified: true },
                  },
                },
              },
            },
            address: {
              type: 'object',
              required: ['fullAddress'],
              properties: {
                fullAddress: { type: 'string', example: '123 Main St, Tech Zone, Dallas' },
                streetAddress: { type: 'string', example: '123 Main St' },
                city: { type: 'string', example: 'Dallas' },
                state: { type: 'string', example: 'Texas' },
                pincode: { type: 'string', example: '75001' },
              },
            },
            location: {
              type: 'object',
              properties: {
                lat: { type: 'number', example: 32.7767 },
                long: { type: 'number', example: -96.797 },
              },
            },
            kyc: {
              type: 'array',
              items: {
                type: 'object',
                required: ['documentType', 'documentUrl'],
                properties: {
                  documentType: { type: 'string', example: 'Aadhaar' },
                  documentNumber: { type: 'string', example: '1234-5678-9012' },
                  documentUrl: { type: 'string', example: 'https://storage.mycarsol.com/kyc/aadhaar.pdf' },
                },
              },
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '670123456789abcdef012388' },
            name: { type: 'string', example: 'Driver' },
            slug: { type: 'string', example: 'driver' },
            description: { type: 'string', example: 'Professional drivers for luxury and premium vehicles' },
            icon: { type: 'string', example: 'car-steering' },
            types: {
              type: 'array',
              items: { type: 'string' },
              example: ['Luxury', 'Premium'],
            },
            fields: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'experience' },
                  label: { type: 'string', example: 'Experience (Years)' },
                  type: { type: 'string', example: 'number' },
                  required: { type: 'boolean', example: true },
                },
              },
            },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CategoryCreateInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Driver' },
            slug: { type: 'string', example: 'driver' },
            description: { type: 'string', example: 'Professional drivers for luxury and premium vehicles' },
            icon: { type: 'string', example: 'car-steering' },
            types: {
              type: 'array',
              items: { type: 'string' },
              example: ['Luxury', 'Premium'],
            },
            fields: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'experience' },
                  label: { type: 'string', example: 'Experience (Years)' },
                  type: { type: 'string', example: 'number' },
                  required: { type: 'boolean', example: true },
                },
              },
            },
            isActive: { type: 'boolean', example: true },
          },
        },
      },
    },
    paths: {
      '/api/health': {
        get: {
          summary: 'Check API Health Status',
          tags: ['Health'],
          responses: {
            200: { description: 'API is running normally' },
          },
        },
      },
      '/api/auth/admin/login': {
        post: {
          summary: 'Admin Login',
          tags: ['Auth & Admin'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AdminLoginInput' },
              },
            },
          },
          responses: {
            200: { description: 'Login successful' },
            401: { description: 'Invalid email or password' },
          },
        },
      },
      '/api/auth/admin': {
        get: {
          summary: 'Get All Admins',
          tags: ['Auth & Admin'],
          responses: { 200: { description: 'List of admins' } },
        },
        post: {
          summary: 'Create New Admin',
          tags: ['Auth & Admin'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AdminCreateInput' },
              },
            },
          },
          responses: { 201: { description: 'Admin created' } },
        },
      },
      '/api/auth/admin/list': {
        get: {
          summary: 'List All Admins',
          tags: ['Auth & Admin'],
          responses: { 200: { description: 'List of admins' } },
        },
      },
      '/api/auth/admin/{id}': {
        get: {
          summary: 'Get Admin Details by ID',
          tags: ['Auth & Admin'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Admin details' }, 404: { description: 'Not found' } },
        },
        put: {
          summary: 'Update Admin',
          tags: ['Auth & Admin'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AdminUpdateInput' },
              },
            },
          },
          responses: { 200: { description: 'Admin updated' } },
        },
        delete: {
          summary: 'Delete Admin',
          tags: ['Auth & Admin'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Admin deleted' } },
        },
      },
      '/api/mechanics/login': {
        post: {
          summary: 'Mechanic Login (by email or mobile number)',
          tags: ['Mechanics'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MechanicLoginInput' },
              },
            },
          },
          responses: {
            200: { description: 'Login successful. Returns token and mechanic profile data' },
            401: { description: 'Invalid email/mobile or password' },
          },
        },
      },
      '/api/mechanics': {
        get: {
          summary: 'Get All Mechanics',
          tags: ['Mechanics'],
          responses: { 200: { description: 'Mechanics list' } },
        },
        post: {
          summary: 'Create New Mechanic',
          tags: ['Mechanics'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MechanicCreateInput' },
              },
            },
          },
          responses: { 201: { description: 'Mechanic created' } },
        },
      },
      '/api/mechanics/{id}/overview': {
        get: {
          summary: 'Get Mechanic Overview & Analytics (Today Jobs, Completed Jobs, Earnings, Rating, Reviews)',
          tags: ['Mechanics'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Mechanic overview and analytics metrics' },
          },
        },
      },
      '/api/mechanics/{id}/kyc': {
        put: {
          summary: 'Submit / Update KYC Documents (Auto-approves pending mechanic)',
          tags: ['Mechanics'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['kyc'],
                  properties: {
                    kyc: {
                      type: 'array',
                      items: {
                        type: 'object',
                        required: ['documentType', 'documentUrl'],
                        properties: {
                          documentType: { type: 'string', example: 'Aadhaar' },
                          documentNumber: { type: 'string', example: '1234-5678-9012' },
                          documentUrl: { type: 'string', example: 'https://storage.mycarsol.com/kyc/aadhaar.pdf' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'KYC verified and account status updated' } },
        },
      },
      '/api/mechanics/{id}': {
        get: {
          summary: 'Get Mechanic Details by ID',
          tags: ['Mechanics'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Mechanic details' } },
        },
        put: {
          summary: 'Update Mechanic',
          tags: ['Mechanics'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MechanicCreateInput' },
              },
            },
          },
          responses: { 200: { description: 'Mechanic updated' } },
        },
        delete: {
          summary: 'Delete Mechanic',
          tags: ['Mechanics'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Mechanic deleted' } },
        },
      },
      '/api/upload/profile-image': {
        post: {
          summary: 'Upload Profile Image to Cloudinary (optionally attach to mechanic)',
          tags: ['Uploads'],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file'],
                  properties: {
                    file: { type: 'string', format: 'binary', description: 'JPG/PNG/WEBP/HEIC, max 5MB' },
                    mechanicId: { type: 'string', description: 'Optional. Updates mechanic.profileImage' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Uploaded. Returns { url, publicId, format, bytes, mechanic }' },
            400: { description: 'No file / invalid type / too large' },
          },
        },
      },
      '/api/upload/certificate': {
        post: {
          summary: 'Upload Category Certificate to Cloudinary (optionally attach to mechanic)',
          tags: ['Uploads'],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file'],
                  properties: {
                    file: { type: 'string', format: 'binary', description: 'Image or PDF, max 10MB' },
                    mechanicId: { type: 'string', description: 'Optional. Saves to mechanic.category.fields.certificate' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Uploaded. Returns { url, publicId, fileName, mimeType, uploadedAt, mechanic }' },
            400: { description: 'No file / invalid type / too large' },
          },
        },
      },
      '/api/categories': {
        get: {
          summary: 'Get All Dynamic Categories',
          tags: ['Categories'],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: { 200: { description: 'List of categories' } },
        },
        post: {
          summary: 'Create Dynamic Category',
          tags: ['Categories'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CategoryCreateInput' },
              },
            },
          },
          responses: { 201: { description: 'Category created' } },
        },
      },
      '/api/categories/{id}': {
        get: {
          summary: 'Get Category Details by ID or Slug',
          tags: ['Categories'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Category details' }, 404: { description: 'Not found' } },
        },
        put: {
          summary: 'Update Category',
          tags: ['Categories'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CategoryCreateInput' },
              },
            },
          },
          responses: { 200: { description: 'Category updated' } },
        },
        delete: {
          summary: 'Delete Category',
          tags: ['Categories'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Category deleted' } },
        },
      },
    },
  },
  apis: ['./src/modules/**/*.routes.ts'],
};

const swaggerSpec = swaggerJsDoc(options);

export default swaggerSpec;
