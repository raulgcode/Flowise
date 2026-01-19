import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

// material-ui
import { Chip, Box, Stack, ToggleButton, ToggleButtonGroup, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import ItemCard from '@/ui-component/cards/ItemCard'
import { gridSpacing } from '@/store/constant'
import AgentsEmptySVG from '@/assets/images/agents_empty.svg'
import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'
import { FlowListTable } from '@/ui-component/table/FlowListTable'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import ErrorBoundary from '@/ErrorBoundary'
import { StyledPermissionButton } from '@/ui-component/button/RBACButtons'
import TablePagination, { DEFAULT_ITEMS_PER_PAGE } from '@/ui-component/pagination/TablePagination'

// API
import chatflowsApi from '@/api/chatflows'

// Hooks
import useApi from '@/hooks/useApi'

// const
import { baseURL, AGENTFLOW_ICONS } from '@/store/constant'
import { useError } from '@/store/context/ErrorContext'

// icons
import { IconPlus, IconLayoutGrid, IconList, IconX, IconAlertTriangle } from '@tabler/icons-react'

// Types
import type { TranslationKeys } from '@/i18n/types'

interface RootState {
    customization: {
        isDarkMode: boolean
    }
}

interface AgentflowData {
    id: string
    name: string
    category?: string
    flowData: string
    type: 'AGENTFLOW' | 'MULTIAGENT'
}

interface FlowNode {
    data: {
        name: string
        label: string
    }
}

interface FlowData {
    nodes?: FlowNode[]
}

interface ImageItem {
    imageSrc: string
    label: string
}

interface IconItem {
    name: string
    icon: React.ComponentType
    color: string
}

type ViewType = 'card' | 'list'
type AgentflowVersion = 'v1' | 'v2'

// ==============================|| AGENTS ||============================== //

const Agentflows = (): JSX.Element => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const theme = useTheme()
    const customization = useSelector((state: RootState) => state.customization)

    const [isLoading, setLoading] = useState<boolean>(true)
    const [images, setImages] = useState<Record<string, ImageItem[]>>({})
    const [icons, setIcons] = useState<Record<string, IconItem[]>>({})
    const [search, setSearch] = useState<string>('')
    const { error, setError } = useError()

    const getAllAgentflows = useApi(chatflowsApi.getAllAgentflows)
    const [view, setView] = useState<ViewType>((localStorage.getItem('flowDisplayStyle') as ViewType) || 'card')
    const [agentflowVersion, setAgentflowVersion] = useState<AgentflowVersion>(
        (localStorage.getItem('agentFlowVersion') as AgentflowVersion) || 'v2'
    )
    const [showDeprecationNotice, setShowDeprecationNotice] = useState<boolean>(true)

    /* Table Pagination */
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [pageLimit, setPageLimit] = useState<number>(DEFAULT_ITEMS_PER_PAGE)
    const [total, setTotal] = useState<number>(0)

    const onChange = (page: number, pageLimit: number): void => {
        setCurrentPage(page)
        setPageLimit(pageLimit)
        refresh(page, pageLimit, agentflowVersion)
    }

    const refresh = (page?: number, limit?: number, nextView?: AgentflowVersion): void => {
        const params = {
            page: page || currentPage,
            limit: limit || pageLimit
        }
        getAllAgentflows.request(nextView === 'v2' ? 'AGENTFLOW' : 'MULTIAGENT', params)
    }

    const handleChange = (_event: React.MouseEvent<HTMLElement>, nextView: ViewType | null): void => {
        if (nextView === null) return
        localStorage.setItem('flowDisplayStyle', nextView)
        setView(nextView)
    }

    const handleVersionChange = (_event: React.MouseEvent<HTMLElement>, nextView: AgentflowVersion | null): void => {
        if (nextView === null) return
        localStorage.setItem('agentFlowVersion', nextView)
        setAgentflowVersion(nextView)
        refresh(1, pageLimit, nextView)
    }

    const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setSearch(event.target.value)
    }

    function filterFlows(data: AgentflowData): boolean {
        return (
            data.name.toLowerCase().indexOf(search.toLowerCase()) > -1 ||
            (data.category !== undefined && data.category.toLowerCase().indexOf(search.toLowerCase()) > -1) ||
            data.id.toLowerCase().indexOf(search.toLowerCase()) > -1
        )
    }

    const addNew = (): void => {
        if (agentflowVersion === 'v2') {
            navigate('/v2/agentcanvas')
        } else {
            navigate('/agentcanvas')
        }
    }

    const goToCanvas = (selectedAgentflow: AgentflowData): void => {
        if (selectedAgentflow.type === 'AGENTFLOW') {
            navigate(`/v2/agentcanvas/${selectedAgentflow.id}`)
        } else {
            navigate(`/agentcanvas/${selectedAgentflow.id}`)
        }
    }

    const handleDismissDeprecationNotice = (): void => {
        setShowDeprecationNotice(false)
    }

    useEffect(() => {
        refresh(currentPage, pageLimit, agentflowVersion)

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getAllAgentflows.error) {
            setError(getAllAgentflows.error)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getAllAgentflows.error])

    useEffect(() => {
        setLoading(getAllAgentflows.loading)
    }, [getAllAgentflows.loading])

    useEffect(() => {
        if (getAllAgentflows.data) {
            try {
                const agentflows = getAllAgentflows.data?.data as AgentflowData[]
                setTotal(getAllAgentflows.data?.total)
                const images: Record<string, ImageItem[]> = {}
                const icons: Record<string, IconItem[]> = {}
                for (let i = 0; i < agentflows.length; i += 1) {
                    const flowDataStr = agentflows[i].flowData
                    const flowData: FlowData = JSON.parse(flowDataStr)
                    const nodes = flowData.nodes || []
                    images[agentflows[i].id] = []
                    icons[agentflows[i].id] = []
                    for (let j = 0; j < nodes.length; j += 1) {
                        if (nodes[j].data.name === 'stickyNote' || nodes[j].data.name === 'stickyNoteAgentflow') continue
                        const foundIcon = AGENTFLOW_ICONS.find((icon) => icon.name === nodes[j].data.name)
                        if (foundIcon) {
                            icons[agentflows[i].id].push(foundIcon)
                        } else {
                            const imageSrc = `${baseURL}/api/v1/node-icon/${nodes[j].data.name}`
                            if (!images[agentflows[i].id].some((img) => img.imageSrc === imageSrc)) {
                                images[agentflows[i].id].push({
                                    imageSrc,
                                    label: nodes[j].data.label
                                })
                            }
                        }
                    }
                }
                setImages(images)
                setIcons(icons)
            } catch (e) {
                console.error(e)
            }
        }
    }, [getAllAgentflows.data])

    return (
        <MainCard>
            {error ? (
                <ErrorBoundary error={error} />
            ) : (
                <Stack flexDirection='column' sx={{ gap: 3 }}>
                    <ViewHeader
                        onSearchChange={onSearchChange}
                        search={true}
                        searchPlaceholder={t('agentflows.searchPlaceholder' as TranslationKeys)}
                        title={t('agentflows.title' as TranslationKeys)}
                        description={t('agentflows.description' as TranslationKeys)}
                    >
                        <ToggleButtonGroup
                            sx={{ borderRadius: 2, maxHeight: 40 }}
                            value={agentflowVersion}
                            color='primary'
                            exclusive
                            onChange={handleVersionChange}
                        >
                            <ToggleButton
                                sx={{
                                    borderColor: theme.palette.grey[900] + 25,
                                    borderRadius: 2,
                                    color: customization.isDarkMode ? 'white' : 'inherit'
                                }}
                                value='v2'
                                title={t('agentflows.v2' as TranslationKeys)}
                            >
                                <Chip sx={{ mr: 1 }} label={t('common.new' as TranslationKeys)} size='small' color='primary' />
                                {t('agentflows.v2' as TranslationKeys)}
                            </ToggleButton>
                            <ToggleButton
                                sx={{
                                    borderColor: theme.palette.grey[900] + 25,
                                    borderRadius: 2,
                                    color: customization.isDarkMode ? 'white' : 'inherit'
                                }}
                                value='v1'
                                title={t('agentflows.v1' as TranslationKeys)}
                            >
                                {t('agentflows.v1' as TranslationKeys)}
                            </ToggleButton>
                        </ToggleButtonGroup>
                        <ToggleButtonGroup
                            sx={{ borderRadius: 2, maxHeight: 40 }}
                            value={view}
                            disabled={total === 0}
                            color='primary'
                            exclusive
                            onChange={handleChange}
                        >
                            <ToggleButton
                                sx={{
                                    borderColor: theme.palette.grey[900] + 25,
                                    borderRadius: 2,
                                    color: customization.isDarkMode ? 'white' : 'inherit'
                                }}
                                value='card'
                                title={t('common.cardView' as TranslationKeys)}
                            >
                                <IconLayoutGrid />
                            </ToggleButton>
                            <ToggleButton
                                sx={{
                                    borderColor: theme.palette.grey[900] + 25,
                                    borderRadius: 2,
                                    color: customization.isDarkMode ? 'white' : 'inherit'
                                }}
                                value='list'
                                title={t('common.listView' as TranslationKeys)}
                            >
                                <IconList />
                            </ToggleButton>
                        </ToggleButtonGroup>
                        <StyledPermissionButton
                            permissionId={'agentflows:create'}
                            variant='contained'
                            onClick={addNew}
                            startIcon={<IconPlus />}
                            sx={{ borderRadius: 2, height: 40 }}
                        >
                            {t('common.addNew' as TranslationKeys)}
                        </StyledPermissionButton>
                    </ViewHeader>

                    {/* Deprecation Notice For V1 */}
                    {agentflowVersion === 'v1' && showDeprecationNotice && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: 2,
                                background: customization.isDarkMode
                                    ? 'linear-gradient(135deg,rgba(165, 128, 6, 0.31) 0%, #ffcc802f 100%)'
                                    : 'linear-gradient(135deg, #fff8e17a 0%, #ffcc804a 100%)',
                                color: customization.isDarkMode ? 'white' : '#333333',
                                fontWeight: 400,
                                borderRadius: 2,
                                gap: 1.5
                            }}
                        >
                            <IconAlertTriangle
                                size={20}
                                style={{
                                    color: customization.isDarkMode ? '#ffcc80' : '#f57c00',
                                    flexShrink: 0
                                }}
                            />
                            <Box sx={{ flex: 1 }}>
                                <strong>{t('agentflows.deprecationNotice.title' as TranslationKeys)}</strong>{' '}
                                {t('agentflows.deprecationNotice.message' as TranslationKeys)}
                            </Box>
                            <IconButton
                                aria-label={t('common.dismiss' as TranslationKeys)}
                                size='small'
                                onClick={handleDismissDeprecationNotice}
                                sx={{
                                    color: customization.isDarkMode ? '#ffcc80' : '#f57c00',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 204, 128, 0.1)'
                                    }
                                }}
                            >
                                <IconX size={16} />
                            </IconButton>
                        </Box>
                    )}
                    {!isLoading && total > 0 && (
                        <>
                            {!view || view === 'card' ? (
                                <Box display='grid' gridTemplateColumns='repeat(3, 1fr)' gap={gridSpacing}>
                                    {getAllAgentflows.data?.data.filter(filterFlows).map((data: AgentflowData, index: number) => (
                                        <ItemCard
                                            key={index}
                                            onClick={() => goToCanvas(data)}
                                            data={data}
                                            images={images[data.id]}
                                            icons={icons[data.id]}
                                        />
                                    ))}
                                </Box>
                            ) : (
                                <FlowListTable
                                    isAgentCanvas={true}
                                    isAgentflowV2={agentflowVersion === 'v2'}
                                    data={getAllAgentflows.data?.data}
                                    images={images}
                                    icons={icons}
                                    isLoading={isLoading}
                                    filterFunction={filterFlows}
                                    updateFlowsApi={getAllAgentflows}
                                    setError={setError}
                                    currentPage={currentPage}
                                    pageLimit={pageLimit}
                                />
                            )}
                            {/* Pagination and Page Size Controls */}
                            <TablePagination currentPage={currentPage} limit={pageLimit} total={total} onChange={onChange} />
                        </>
                    )}

                    {!isLoading && total === 0 && (
                        <Stack sx={{ alignItems: 'center', justifyContent: 'center' }} flexDirection='column'>
                            <Box sx={{ p: 2, height: 'auto' }}>
                                <img
                                    style={{ objectFit: 'cover', height: '12vh', width: 'auto' }}
                                    src={AgentsEmptySVG}
                                    alt='AgentsEmptySVG'
                                />
                            </Box>
                            <div>{t('agentflows.noAgentsYet' as TranslationKeys)}</div>
                        </Stack>
                    )}
                </Stack>
            )}
            <ConfirmDialog />
        </MainCard>
    )
}

export default Agentflows
