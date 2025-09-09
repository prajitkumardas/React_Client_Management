import { format, addDays, differenceInDays, isAfter, isBefore } from 'date-fns'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'

// Date utilities
export const dateUtils = {
  formatDate: (date) => format(new Date(date), 'dd/MM/yyyy'),
  formatDateTime: (date) => format(new Date(date), 'dd/MM/yyyy HH:mm'),
  addDays: (date, days) => addDays(new Date(date), days),
  getDaysUntilExpiry: (endDate) => differenceInDays(new Date(endDate), new Date()),
  isExpired: (endDate) => isAfter(new Date(), new Date(endDate)),
  isExpiringSoon: (endDate, days = 3) => {
    const daysUntil = differenceInDays(new Date(endDate), new Date())
    return daysUntil <= days && daysUntil >= 0
  }
}

// Package status utilities
export const getPackageStatus = (startDate, endDate) => {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (isBefore(now, start)) {
    return 'upcoming'
  } else if (isAfter(now, end)) {
    return 'expired'
  } else if (dateUtils.isExpiringSoon(endDate)) {
    return 'expiring_soon'
  } else {
    return 'active'
  }
}

// Export utilities
export const exportUtils = {
  // Export clients to Excel
  exportClientsToExcel: (clients, filename = 'clients.xlsx') => {
    const exportData = clients.map(client => ({
      'Name': client.name,
      'Email': client.email || '',
      'Phone': client.phone || '',
      'Address': client.address || '',
      'Created Date': dateUtils.formatDate(client.created_at),
      'Active Packages': client.client_packages?.filter(cp => cp.status === 'active').length || 0,
      'Total Packages': client.client_packages?.length || 0
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients')
    XLSX.writeFile(workbook, filename)
  },

  // Export packages to Excel
  exportPackagesToExcel: (packages, filename = 'packages.xlsx') => {
    const exportData = packages.map(pkg => ({
      'Package Name': pkg.name,
      'Duration (Days)': pkg.duration_days,
      'Price': pkg.price || 0,
      'Created Date': dateUtils.formatDate(pkg.created_at)
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Packages')
    XLSX.writeFile(workbook, filename)
  },

  // Generate client report PDF
  generateClientReportPDF: (client, filename = 'client-report.pdf') => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.text('Client Report', 20, 30)
    
    // Client details
    doc.setFontSize(12)
    doc.text(`Name: ${client.name}`, 20, 50)
    doc.text(`Email: ${client.email || 'N/A'}`, 20, 60)
    doc.text(`Phone: ${client.phone || 'N/A'}`, 20, 70)
    doc.text(`Address: ${client.address || 'N/A'}`, 20, 80)
    doc.text(`Member Since: ${dateUtils.formatDate(client.created_at)}`, 20, 90)
    
    // Packages section
    if (client.client_packages && client.client_packages.length > 0) {
      doc.text('Packages:', 20, 110)
      let yPos = 120
      
      client.client_packages.forEach((cp, index) => {
        doc.text(`${index + 1}. ${cp.packages_catalog?.name || 'Unknown Package'}`, 25, yPos)
        doc.text(`   Status: ${cp.status.toUpperCase()}`, 25, yPos + 10)
        doc.text(`   Period: ${dateUtils.formatDate(cp.start_date)} - ${dateUtils.formatDate(cp.end_date)}`, 25, yPos + 20)
        yPos += 35
      })
    }
    
    doc.save(filename)
  }
}

// Form validation utilities
export const validation = {
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },
  
  isValidPhone: (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  },
  
  isRequired: (value) => {
    return value && value.toString().trim().length > 0
  }
}

// UI utilities
export const uiUtils = {
  getStatusColor: (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'expiring_soon':
        return 'bg-yellow-100 text-yellow-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  },
  
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0)
  }
}