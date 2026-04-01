const { Employee, EmployeePayment, Adjustment, Attendance } = require('../models');
const PayrollService = require('./payrollService');
const CloudinaryService = require('./cloudinaryService');

const toNumber = (v) => Number(v || 0);

class EmployeeService {
    static async getAllEmployees() {
        const employees = await Employee.find({ is_deleted: { $ne: true } }).sort({ name: 1 });

        // Calculate totals for each employee using payroll service
        const result = await Promise.all(
            employees.map(async (employee) => {
                try {
                    const balanceData = await PayrollService.calculateEmployeeBalance(employee._id);
                    const attendanceCount = await Attendance.countDocuments({ employee_id: employee._id });

                    return {
                        id: employee._id,
                        name: employee.name,
                        job_title: employee.job_title,
                        phone_number: employee.phone_number,
                        basic_salary: employee.basic_salary || employee.base_salary,
                        start_working_date: employee.start_working_date,
                        end_working_date: employee.end_working_date,
                        status: employee.status,
                        notes: employee.notes,
                        all_projects: employee.all_projects,
                        assigned_projects: employee.assigned_projects,
                        created_at: employee.created_at,
                        // Payroll calculations
                        balance: balanceData.balance,
                        balance_status: balanceData.balance_status,
                        balance_description: balanceData.balance_description,
                        total_earned_salary: balanceData.total_earned_salary,
                        total_payments: balanceData.total_payments,
                        total_adjustments: balanceData.total_adjustments,
                        total_worked_days: balanceData.salary_details.total_worked_days,
                        attendanceCount: attendanceCount
                    };
                } catch (error) {
                    // Return employee with zero calculations if payroll calculation fails
                    return {
                        id: employee._id,
                        name: employee.name,
                        job_title: employee.job_title,
                        phone_number: employee.phone_number,
                        basic_salary: employee.basic_salary || employee.base_salary,
                        start_working_date: employee.start_working_date,
                        end_working_date: employee.end_working_date,
                        status: employee.status,
                        notes: employee.notes,
                        all_projects: employee.all_projects,
                        assigned_projects: employee.assigned_projects,
                        created_at: employee.created_at,
                        balance: 0,
                        balance_status: 'error',
                        balance_description: 'خطأ في الحساب',
                        total_earned_salary: 0,
                        total_payments: 0,
                        total_adjustments: 0,
                        total_worked_days: 0,
                        attendanceCount: 0,
                        error: error.message
                    };
                }
            })
        );

        return { employees: result };
    }

    static async getEmployeeById(id) {
        const employee = await Employee.findById(id);

        if (!employee) {
            return null;
        }

        // Get related data
        console.time("payments_query");
        const payments = await EmployeePayment.find({ 
            employee_id: id,
            is_deleted: { $ne: true }
        }).sort({ paid_at: -1 });
        console.timeEnd("payments_query");
        const adjustments = await Adjustment.find({
            entity_type: 'employee',
            entity_id: id,
            is_deleted: { $ne: true }
        }).sort({ created_at: -1 });
        const attendance = await Attendance.find({ employee_id: id })
            .sort({ period_start: -1 });
        console.time("payroll_calculation");
        const balanceData = await PayrollService.calculateEmployeeBalance(employee);
        console.timeEnd("payroll_calculation");


        return {
            employee: {
                id: employee._id,
                name: employee.name,
                job_title: employee.job_title,
                phone_number: employee.phone_number,
                basic_salary: employee.basic_salary,
                start_working_date: employee.start_working_date,
                end_working_date: employee.end_working_date,
                status: employee.status,
                notes: employee.notes,
                all_projects: employee.all_projects,
                assigned_projects: employee.assigned_projects,
                created_at: employee.created_at
            },
            payments: payments.map(p => ({
                id: p._id,
                amount: p.amount,
                method: p.method,
                details: p.details,
                note: p.note,
                payment_image_url: p.payment_image_url,
                payment_image_thumbnail: p.payment_image_thumbnail,
                paid_at: p.paid_at,
                created_at: p.created_at
            })),
            adjustments: adjustments.map(a => ({
                id: a._id,
                amount: a.amount,
                method: a.method,
                details: a.details,
                reason: a.reason,
                created_at: a.created_at
            })),
            attendance: attendance.map(a => ({
                id: a._id,
                period_start: a.period_start,
                period_end: a.period_end,
                period_days: a.period_days,
                record_type: a.record_type,
                attendance_days: a.attendance_days,
                absence_days: a.absence_days,
                worked_days: a.worked_days,
                notes: a.notes,
                created_at: a.created_at
            })),
            // Payroll calculations
            totals: {
                balance: balanceData.balance,
                balance_status: balanceData.balance_status,
                balance_description: balanceData.balance_description,
                total_earned_salary: balanceData.total_earned_salary,
                total_payments: balanceData.total_payments,
                total_adjustments: balanceData.total_adjustments,
                total_worked_days: balanceData.salary_details.total_worked_days,
                total_period_days: balanceData.salary_details.total_period_days,
                attendance_records_count: balanceData.salary_details.attendance_records_count,
                average_daily_rate: balanceData.salary_details.average_daily_rate
            }
        };
    }

    static async createEmployee(data) {
        // Check if employee with same name already exists
        const existingEmployee = await Employee.findOne({ 
            name: data.name.trim(),
            is_deleted: { $ne: true }
        });

        if (existingEmployee) {
            const error = new Error('اسم الموظف موجود بالفعل');
            error.code = 11000;
            throw error;
        }

        // Remove opening_balance if provided (not used in new system)
        const { opening_balance, ...employeeData } = data;

        // Handle project assignments
        if (employeeData.all_projects) {
            employeeData.assigned_projects = []; // Clear specific assignments if all projects is selected
        }

        const employee = new Employee(employeeData);
        await employee.save();
        return {
            id: employee._id,
            name: employee.name,
            job_title: employee.job_title,
            phone_number: employee.phone_number,
            basic_salary: employee.basic_salary,
            start_working_date: employee.start_working_date,
            end_working_date: employee.end_working_date,
            status: employee.status,
            notes: employee.notes,
            all_projects: employee.all_projects,
            assigned_projects: employee.assigned_projects,
            created_at: employee.created_at
        };
    }

    static async updateEmployee(id, data) {
        // Remove opening_balance if provided (not used in new system)
        const { opening_balance, ...updateData } = data;

        // Handle project assignments
        if (updateData.all_projects) {
            updateData.assigned_projects = []; // Clear specific assignments if all projects is selected
        }

        const employee = await Employee.findByIdAndUpdate(id, updateData, { new: true });
        if (!employee) return null;

        return {
            id: employee._id,
            name: employee.name,
            job_title: employee.job_title,
            phone_number: employee.phone_number,
            basic_salary: employee.basic_salary,
            start_working_date: employee.start_working_date,
            end_working_date: employee.end_working_date,
            status: employee.status,
            notes: employee.notes,
            all_projects: employee.all_projects,
            assigned_projects: employee.assigned_projects,
            created_at: employee.created_at
        };
    }

    static async deleteEmployee(id) {
        const employee = await Employee.findById(id);
        
        if (!employee) {
            return null;
        }

        // Soft delete
        employee.is_deleted = true;
        employee.deleted_at = new Date();
        await employee.save();

        return employee;
    }

    // Payment methods (unchanged)
    static async addEmployeePayment(employeeId, paymentData) {
        const payment = new EmployeePayment({
            employee_id: employeeId,
            amount: toNumber(paymentData.amount),
            method: paymentData.method,
            details: paymentData.details,
            note: paymentData.note,
            paid_at: paymentData.paid_at,
            payment_image_url: paymentData.payment_image_url,
            payment_image_public_id: paymentData.payment_image_public_id,
            payment_image_thumbnail: paymentData.payment_image_thumbnail
        });
        await payment.save();
        return payment;
    }

    static async getPaymentById(employeeId, paymentId) {
        return await EmployeePayment.findOne({
            _id: paymentId,
            employee_id: employeeId
        });
    }

    static async updateEmployeePayment(employeeId, paymentId, paymentData) {
        const updateData = {
            amount: toNumber(paymentData.amount),
            method: paymentData.method,
            details: paymentData.details,
            note: paymentData.note,
            paid_at: paymentData.paid_at
        };

        if (paymentData.payment_image_url) {
            updateData.payment_image_url = paymentData.payment_image_url;
            updateData.payment_image_public_id = paymentData.payment_image_public_id;
            updateData.payment_image_thumbnail = paymentData.payment_image_thumbnail;
        }

        const payment = await EmployeePayment.findOneAndUpdate(
            { _id: paymentId, employee_id: employeeId },
            updateData,
            { new: true }
        );
        return payment;
    }

    static async deleteEmployeePayment(employeeId, paymentId) {
        const payment = await EmployeePayment.findOne({
            _id: paymentId,
            employee_id: employeeId,
            is_deleted: { $ne: true }
        });

        if (!payment) {
            return null;
        }

        // Soft delete
        payment.is_deleted = true;
        payment.deleted_at = new Date();
        await payment.save();

        return payment;
    }

    // Attendance methods (updated with validation)
    static async addAttendanceRecord(employeeId, attendanceData) {
        try {
            // Validate using payroll service
            const validatedData = PayrollService.validateAttendanceRecordForSaving(attendanceData);

            const attendance = new Attendance({
                employee_id: employeeId,
                ...validatedData
            });
            await attendance.save();
            return attendance;
        } catch (error) {
            console.error('Error in addAttendanceRecord:', error);
            throw error;
        }
    }

    static async updateAttendanceRecord(employeeId, attendanceId, attendanceData) {
        try {
            // Validate using payroll service
            const validatedData = PayrollService.validateAttendanceRecordForSaving(attendanceData);

            const attendance = await Attendance.findOneAndUpdate(
                { _id: attendanceId, employee_id: employeeId },
                validatedData,
                { new: true, runValidators: true }
            );
            return attendance;
        } catch (error) {
            console.error('Error in updateAttendanceRecord:', error);
            throw error;
        }
    }

    static async deleteAttendanceRecord(employeeId, attendanceId) {
        const attendance = await Attendance.findOneAndDelete({
            _id: attendanceId,
            employee_id: employeeId
        });
        return attendance;
    }
}

module.exports = EmployeeService;