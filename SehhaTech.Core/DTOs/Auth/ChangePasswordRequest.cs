using System;
using System.Collections.Generic;
using System.Text;

namespace SehhaTech.Core.DTOs.Auth
{
    public class ChangePasswordRequest
    {
        public required string OldPassword { get; set; }
        public required string NewPassword { get; set; }
    }
}