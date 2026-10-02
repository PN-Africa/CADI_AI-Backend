var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
export var Role;
(function (Role) {
    Role["CAREGIVER"] = "CAREGIVER";
    Role["HEALTHCARE_PROFESSIONAL"] = "HEALTHCARE_PROFESSIONAL";
})(Role || (Role = {}));
export class SignupDto {
}
__decorate([
    ApiProperty({ enum: Role, description: 'User role: CAREGIVER or HEALTHCARE_PROFESSIONAL' }),
    IsEnum(Role),
    __metadata("design:type", String)
], SignupDto.prototype, "role", void 0);
__decorate([
    ApiPropertyOptional({ description: 'Work Email Address' }),
    IsOptional(),
    IsEmail(),
    __metadata("design:type", String)
], SignupDto.prototype, "email", void 0);
__decorate([
    ApiPropertyOptional({ description: 'Direct Phone Number' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], SignupDto.prototype, "phone", void 0);
__decorate([
    ApiProperty(),
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], SignupDto.prototype, "medicalLicenseId", void 0);
__decorate([
    ApiProperty(),
    IsString(),
    MinLength(8),
    __metadata("design:type", String)
], SignupDto.prototype, "password", void 0);
__decorate([
    ApiProperty(),
    IsString(),
    MinLength(8),
    __metadata("design:type", String)
], SignupDto.prototype, "confirmPassword", void 0);
export class LoginDto {
}
__decorate([
    ApiProperty({ description: 'Email or Phone Number' }),
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], LoginDto.prototype, "identifier", void 0);
__decorate([
    ApiProperty(),
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
export class VerifyEmailDto {
}
__decorate([
    ApiProperty(),
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], VerifyEmailDto.prototype, "token", void 0);
export class ForgotPasswordDto {
}
__decorate([
    ApiProperty({ description: 'Work Email Address' }),
    IsNotEmpty(),
    IsEmail(),
    __metadata("design:type", String)
], ForgotPasswordDto.prototype, "email", void 0);
export class ResetPasswordDto {
}
__decorate([
    ApiProperty(),
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "token", void 0);
__decorate([
    ApiProperty(),
    IsNotEmpty(),
    IsString(),
    MinLength(8),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "newPassword", void 0);
