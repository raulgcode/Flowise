import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton, Menu, MenuItem, Typography, Box } from '@mui/material'
import { IconLanguage } from '@tabler/icons-react'
import { supportedLanguages, SupportedLanguage } from '@/i18n'

const LanguageSelector = (): JSX.Element => {
    const { i18n } = useTranslation()
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const open = Boolean(anchorEl)

    const handleClick = (event: React.MouseEvent<HTMLElement>): void => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = (): void => {
        setAnchorEl(null)
    }

    const handleLanguageChange = (languageCode: SupportedLanguage): void => {
        i18n.changeLanguage(languageCode)
        localStorage.setItem('language', languageCode)
        handleClose()
    }

    const currentLanguage = supportedLanguages.find((lang) => lang.code === i18n.language) || supportedLanguages[0]

    return (
        <>
            <IconButton
                onClick={handleClick}
                size='small'
                sx={{ ml: 1 }}
                aria-controls={open ? 'language-menu' : undefined}
                aria-haspopup='true'
                aria-expanded={open ? 'true' : undefined}
            >
                <IconLanguage size={20} />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                id='language-menu'
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {supportedLanguages.map((language) => (
                    <MenuItem
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        selected={language.code === currentLanguage.code}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography component='span'>{language.flag}</Typography>
                            <Typography>{language.name}</Typography>
                        </Box>
                    </MenuItem>
                ))}
            </Menu>
        </>
    )
}

export default LanguageSelector
